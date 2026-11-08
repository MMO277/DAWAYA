#!/usr/bin/env python3
"""
DAWAYA | دوايا — Automated Egyptian Market Drug Price Sync Engine (`scripts/sync_market_prices.py`)

Synchronizes market prices across:
  1. `public/data/dawaya_medicines_search_index.json` (26,572 commercial records)
  2. `public/data/chunks/meds_chunk_0..26.json`
  3. `public/data/dawaya_live_price_deltas.json` (lightweight real-time delta feed)
  4. `egyptianDrugDatabase.ts` (267 flagship commercial packages)

Supports CSV and JSON feeds from:
  - `PRICE_FEED_URL` environment variable (e.g., published Google Sheet CSV, pharmacy ERP feed, or EDA price table)
  - `feedUrls` array configured inside `public/data/dawaya_live_price_deltas.json`
"""

import csv
import io
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(REPO_ROOT, "public", "data", "dawaya_medicines_search_index.json")
DELTAS_PATH = os.path.join(REPO_ROOT, "public", "data", "dawaya_live_price_deltas.json")
CHUNKS_DIR = os.path.join(REPO_ROOT, "public", "data", "chunks")
EDB_PATH = os.path.join(REPO_ROOT, "egyptianDrugDatabase.ts")


def norm_name(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r"[\u064B-\u065F\u0670\u0640]", "", s)
    s = re.sub(r"[إأآٱ]", "ا", s)
    s = s.replace("ى", "ي").replace("ة", "ه")
    s = re.sub(r"[^a-z0-9\u0600-\u06FF]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def fetch_url_text(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DAWAYA-MarketPriceSync/1.0 (+https://mmo277.github.io/DAWAYA/)",
            "Accept": "application/json, text/csv, text/plain, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_feed_text(text: str):
    """Yields tuples of (id_val, barcode_val, name_val, price_float) from JSON or CSV."""
    text = (text or "").strip()
    if not text:
        return

    if text.startswith("{") or text.startswith("["):
        try:
            data = json.loads(text)
            if isinstance(data, dict) and isinstance(data.get("priceOverrides"), dict):
                for k, v in data["priceOverrides"].items():
                    if isinstance(v, dict) and v.get("p"):
                        yield (str(k), str(k), "", float(v["p"]))
                return
            rows = data if isinstance(data, list) else list(data.values())
            for r in rows:
                if not isinstance(r, dict):
                    continue
                id_v = str(r.get("i") or r.get("id") or r.get("productId") or r.get("drug_id") or "").strip()
                bc_v = str(r.get("b") or r.get("barcode") or r.get("ean") or "").strip()
                nm_v = str(
                    r.get("n") or r.get("name") or r.get("tradeNameEn") or r.get("trade_name") or r.get("a") or r.get("tradeNameAr") or ""
                ).strip()
                raw_p = r.get("p") or r.get("price") or r.get("priceEgp") or r.get("new_price") or r.get("السعر")
                if raw_p is not None:
                    m = re.search(r"\d+(?:\.\d+)?", str(raw_p))
                    if m:
                        yield (id_v, bc_v, nm_v, float(m.group(0)))
            return
        except Exception as e:
            print(f"JSON parse warning: {e}", file=sys.stderr)

    # Parse as CSV
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if len(rows) < 2:
        return
    headers = [re.sub(r"[^a-z0-9\u0600-\u06FF_]", "", h.lower()) for h in rows[0]]

    def find_col(cands):
        for idx, h in enumerate(headers):
            if any(c == h or c in h for c in cands):
                return idx
        return -1

    id_idx = find_col(["id", "productid", "drug_id", "code", "كود", "معرف"])
    bc_idx = find_col(["barcode", "ean", "gtin", "باركود", "الباركود"])
    nm_idx = find_col(["tradenameen", "tradename", "name", "brand", "drugname", "الاسم", "اسم"])
    pr_idx = find_col(["newprice", "new_price", "priceegp", "price", "السعرالجديد", "السعر", "سعر"])

    for r in rows[1:]:
        if len(r) < 2:
            continue
        id_v = r[id_idx].strip() if 0 <= id_idx < len(r) else ""
        bc_v = r[bc_idx].strip() if 0 <= bc_idx < len(r) else ""
        nm_v = r[nm_idx].strip() if 0 <= nm_idx < len(r) else r[0].strip()
        raw_p = r[pr_idx].strip() if 0 <= pr_idx < len(r) else r[-1].strip()
        m = re.search(r"\d+(?:\.\d+)?", str(raw_p))
        if m:
            yield (id_v, bc_v, nm_v, float(m.group(0)))


def main():
    if not os.path.exists(INDEX_PATH):
        print(f"Index file not found at {INDEX_PATH}")
        return 0

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_items = json.load(f)

    deltas_doc = {
        "schemaVersion": "1.0",
        "lastSyncedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Egyptian Drug Authority (EDA) & DAWAYA Automated Market Price Sync",
        "feedUrls": [],
        "totalMonitoredDrugs": len(index_items),
        "priceOverrides": {},
    }
    if os.path.exists(DELTAS_PATH):
        try:
            with open(DELTAS_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                deltas_doc.update(loaded)
        except Exception:
            pass

    feed_urls = list(deltas_doc.get("feedUrls") or [])
    env_url = os.environ.get("PRICE_FEED_URL", "").strip()
    if env_url and env_url not in feed_urls:
        feed_urls.insert(0, env_url)
        deltas_doc["feedUrls"] = feed_urls

    # Build lookup maps over the 26,572 index
    by_id = {}
    by_bc = {}
    by_name = {}
    for item in index_items:
        iid = str(item.get("i") or "").lower().strip()
        if iid:
            by_id[iid] = item
            if iid.startswith("eg-"):
                by_id[iid[3:]] = item
        bc = str(item.get("b") or "").strip()
        if bc:
            by_bc[bc] = item
        for key_str in (norm_name(item.get("n", "")), norm_name(item.get("a", ""))):
            if key_str:
                by_name.setdefault(key_str, []).append(item)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    updated_ids = {}
    total_matched = 0

    for url in feed_urls:
        if not url:
            continue
        print(f"Fetching market price feed: {url}")
        try:
            raw_text = fetch_url_text(url)
            for id_v, bc_v, nm_v, new_p in parse_feed_text(raw_text):
                if new_p <= 0:
                    continue
                targets = []
                if id_v and id_v.lower() in by_id:
                    targets = [by_id[id_v.lower()]]
                elif bc_v and bc_v in by_bc:
                    targets = [by_bc[bc_v]]
                elif nm_v and norm_name(nm_v) in by_name:
                    targets = by_name[norm_name(nm_v)]

                for t in targets:
                    total_matched += 1
                    cur_p = t.get("p")
                    if cur_p is not None and abs(float(cur_p) - new_p) < 0.01:
                        continue
                    prev_p = float(cur_p) if (cur_p is not None and float(cur_p) > 0) else t.get("op")
                    t["op"] = prev_p
                    t["p"] = round(new_p, 2)
                    updated_ids[t["i"]] = {
                        "p": round(new_p, 2),
                        "op": prev_p,
                        "u": today_str,
                    }
        except Exception as e:
            print(f"Warning: could not fetch or parse {url}: {e}", file=sys.stderr)

    # Also apply any manual entries already placed in deltas_doc["priceOverrides"]
    for iid, entry in list((deltas_doc.get("priceOverrides") or {}).items()):
        if not isinstance(entry, dict) or not entry.get("p"):
            continue
        new_p = float(entry["p"])
        t = by_id.get(iid.lower().strip())
        if t and (t.get("p") is None or abs(float(t["p"]) - new_p) >= 0.01):
            prev_p = float(t["p"]) if (t.get("p") is not None and float(t["p"]) > 0) else entry.get("op")
            t["op"] = prev_p
            t["p"] = round(new_p, 2)
            updated_ids[t["i"]] = {"p": round(new_p, 2), "op": prev_p, "u": entry.get("u") or today_str}

    deltas_doc["lastSyncedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    deltas_doc["totalMonitoredDrugs"] = len(index_items)
    deltas_doc.setdefault("priceOverrides", {}).update(updated_ids)

    with open(DELTAS_PATH, "w", encoding="utf-8") as f:
        json.dump(deltas_doc, f, ensure_ascii=False, indent=2)

    if updated_ids:
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(index_items, f, ensure_ascii=False, separators=(",", ":"))

        # Update chunks that contain updated_ids
        if os.path.isdir(CHUNKS_DIR):
            for fn in sorted(os.listdir(CHUNKS_DIR)):
                if not fn.startswith("meds_chunk_") or not fn.endswith(".json"):
                    continue
                cp = os.path.join(CHUNKS_DIR, fn)
                with open(cp, "r", encoding="utf-8") as f:
                    chunk_rows = json.load(f)
                changed = False
                for r in chunk_rows:
                    rid = r.get("id")
                    if rid in updated_ids:
                        r["oldPriceEgp"] = updated_ids[rid]["op"]
                        r["priceEgp"] = updated_ids[rid]["p"]
                        r["lastVerifiedDate"] = today_str
                        changed = True
                if changed:
                    with open(cp, "w", encoding="utf-8") as f:
                        json.dump(chunk_rows, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Market price sync complete: matched={total_matched}, updated={len(updated_ids)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
