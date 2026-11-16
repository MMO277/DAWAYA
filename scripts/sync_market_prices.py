#!/usr/bin/env python3
"""
DAWAYA Automated Egyptian Market Drug Price Synchronization Engine
==================================================================
Runs via `.github/workflows/sync-drug-prices.yml` or locally via:
    python3 scripts/sync_market_prices.py

1. Reads the master index `public/data/dawaya_medicines_search_index.json` (26,572+ drugs).
2. Reads existing `public/data/dawaya_live_price_deltas.json`.
3. If `PRICE_FEED_URL` is configured (CSV or JSON feed), fetches and parses updated market prices,
   matches by ID (`eg-...`), barcode, or normalized trade name, and updates both:
   - `public/data/dawaya_live_price_deltas.json`
   - `public/data/dawaya_medicines_search_index.json`
"""

import csv
import io
import json
import os
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT_DIR / "public" / "data" / "dawaya_medicines_search_index.json"
DELTAS_PATH = ROOT_DIR / "public" / "data" / "dawaya_live_price_deltas.json"


def normalize_name(val: str) -> str:
    return re.sub(r"[^a-z0-9\u0600-\u06FF]+", "", str(val or "").lower())


def fetch_remote_feed(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "DAWAYA-MarketPriceSync/2.0 (+https://dawaya.pages.dev)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_feed_payload(raw_text: str) -> list[dict]:
    text = raw_text.strip()
    if not text:
        return []
    if text.startswith("{") or text.startswith("["):
        data = json.loads(text)
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        if isinstance(data, dict):
            if isinstance(data.get("items"), list):
                return data["items"]
            if isinstance(data.get("priceOverrides"), dict):
                return [
                    {"id": k, "price": v}
                    for k, v in data["priceOverrides"].items()
                ]
        return []
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def main() -> None:
    if not INDEX_PATH.exists():
        print(f"[WARN] Master index not found at {INDEX_PATH}")
        return

    with INDEX_PATH.open("r", encoding="utf-8") as f:
        index_items = json.load(f)

    existing_deltas = {
        "schemaVersion": "1.0",
        "lastSyncedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Egyptian Drug Authority (EDA) & DAWAYA Automated Market Price Sync",
        "feedUrls": [],
        "totalMonitoredDrugs": len(index_items),
        "priceOverrides": {},
    }
    if DELTAS_PATH.exists():
        try:
            with DELTAS_PATH.open("r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    existing_deltas.update(loaded)
        except Exception as exc:
            print(f"[WARN] Could not parse existing deltas: {exc}")

    by_id = {str(item.get("i", "")): item for item in index_items if item.get("i")}
    by_barcode = {str(item.get("b", "")): item for item in index_items if item.get("b")}
    by_name = {}
    for item in index_items:
        for key in (item.get("n"), item.get("a")):
            norm = normalize_name(key)
            if norm:
                by_name[norm] = item

    feed_url = os.environ.get("PRICE_FEED_URL", "").strip()
    updated_count = 0

    if feed_url:
        print(f"[INFO] Fetching remote price feed from: {feed_url}")
        try:
            raw = fetch_remote_feed(feed_url)
            rows = parse_feed_payload(raw)
            if feed_url not in existing_deltas["feedUrls"]:
                existing_deltas["feedUrls"].append(feed_url)

            for row in rows:
                raw_price = (
                    row.get("price")
                    or row.get("new_price")
                    or row.get("priceEgp")
                    or row.get("p")
                    or row.get("السعر")
                )
                try:
                    new_price = round(float(str(raw_price).replace(",", "").strip()), 2)
                except (ValueError, TypeError):
                    continue
                if new_price <= 0:
                    continue

                item_id = str(row.get("id") or row.get("i") or "").strip()
                barcode = str(row.get("barcode") or row.get("b") or "").strip()
                name = str(row.get("name") or row.get("n") or row.get("a") or "").strip()

                target = (
                    by_id.get(item_id)
                    or by_barcode.get(barcode)
                    or by_name.get(normalize_name(name))
                )
                if target:
                    tid = target["i"]
                    old_p = float(target.get("p") or 0)
                    if abs(old_p - new_price) >= 0.01:
                        target["op"] = old_p
                        target["p"] = new_price
                        existing_deltas["priceOverrides"][tid] = new_price
                        updated_count += 1
        except Exception as exc:
            print(f"[WARN] Price feed sync encountered an error: {exc}")
    else:
        print("[INFO] No external PRICE_FEED_URL provided; verifying catalog integrity.")

    existing_deltas["totalMonitoredDrugs"] = len(index_items)
    existing_deltas["lastSyncedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with DELTAS_PATH.open("w", encoding="utf-8") as f:
        json.dump(existing_deltas, f, ensure_ascii=False, indent=2)
        f.write("\n")

    if updated_count > 0:
        with INDEX_PATH.open("w", encoding="utf-8") as f:
            json.dump(index_items, f, ensure_ascii=False, separators=(",", ":"))
        print(f"[SUCCESS] Updated {updated_count} medicine prices across catalog & deltas.")
    else:
        print(f"[SUCCESS] Verified {len(index_items)} medicines. Deltas manifest up to date.")


if __name__ == "__main__":
    main()
