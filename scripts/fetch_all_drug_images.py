#!/usr/bin/env python3
"""
DAWAYA Bulk Image URL Collector (scripts/fetch_all_drug_images.py)
------------------------------------------------------------------
Multi-threaded collector that scans all 26,615+ DAWAYA items and enriches
`public/data/dawaya_drug_images.json` with real product image URLs from:
  1. Open Beauty Facts & Open Food Facts (by EAN/UPC barcode)
  2. Wikimedia Commons / Wikipedia REST API (by brand / active ingredient)
  3. Brand keyword propagation across matching SKUs

Runs automatically on GitHub Actions (.github/workflows/fetch-drug-images.yml)
or locally via: python3 scripts/fetch_all_drug_images.py
"""
import concurrent.futures
import json
import os
import re
import threading
import urllib.error
import urllib.parse
import urllib.request

INDEX_PATH = os.path.join("public", "data", "dawaya_medicines_search_index.json")
IMAGES_PATH = os.path.join("public", "data", "dawaya_drug_images.json")

LOCK = threading.Lock()


def http_get_json(url: str, timeout: float = 5.0):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "DAWAYA-Pharmacy-Catalog/2.0 (https://dawaya.pages.dev)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_barcode_image(barcode: str) -> str:
    clean = "".join(ch for ch in (barcode or "") if ch.isdigit())
    if len(clean) < 8:
        return ""
    for domain in ("world.openbeautyfacts.org", "world.openfoodfacts.org"):
        try:
            data = http_get_json(
                f"https://{domain}/api/v0/product/{clean}.json?fields=image_front_url,image_url"
            )
            if data.get("status") == 1:
                prod = data.get("product") or {}
                img = prod.get("image_front_url") or prod.get("image_url") or ""
                if img.startswith("http"):
                    return img
        except (urllib.error.URLError, TimeoutError, ValueError):
            continue
    return ""


def fetch_wikimedia_brand_image(brand_token: str) -> str:
    if not brand_token or len(brand_token) < 4:
        return ""
    try:
        q = urllib.parse.quote(brand_token)
        data = http_get_json(f"https://en.wikipedia.org/api/rest_v1/page/summary/{q}")
        thumb = (data.get("thumbnail") or {}).get("source") or ""
        if thumb.startswith("http") and not thumb.endswith(".svg"):
            return thumb
    except (urllib.error.URLError, TimeoutError, ValueError):
        pass
    return ""


def main():
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    if os.path.exists(IMAGES_PATH):
        with open(IMAGES_PATH, "r", encoding="utf-8") as f:
            img_store = json.load(f)
    else:
        img_store = {"version": 1, "byId": {}, "byKeyword": {}}

    by_id = img_store.setdefault("byId", {})
    by_kw = img_store.setdefault("byKeyword", {})

    # 1. Propagate existing keyword matches first
    for item in items:
        iid = item.get("i", "")
        if not iid or iid in by_id:
            continue
        name_l = (item.get("n") or "").lower()
        for kw, url in by_kw.items():
            if kw in name_l:
                by_id[iid] = url
                break

    # 2. Fetch barcode images in parallel for all unmapped barcoded items
    barcoded_todo = [
        it for it in items
        if it.get("i") and it["i"] not in by_id and len("".join(c for c in (it.get("b") or "") if c.isdigit())) >= 8
    ]

    added_barcode = 0

    def worker_barcode(it):
        url = fetch_barcode_image(it.get("b", ""))
        return it["i"], url

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for idx_num, (iid, url) in enumerate(pool.map(worker_barcode, barcoded_todo), 1):
            if url:
                with LOCK:
                    by_id[iid] = url
                    added_barcode += 1
            if idx_num % 250 == 0:
                with LOCK:
                    with open(IMAGES_PATH, "w", encoding="utf-8") as f:
                        json.dump(img_store, f, ensure_ascii=False, indent=2)
                print(f"Barcode progress: {idx_num}/{len(barcoded_todo)} (found {added_barcode})")

    # 3. Enrich top unmapped brands via Wikipedia/Wikimedia summary thumbnails
    brand_tokens = []
    seen_tokens = set(by_kw.keys())
    for it in items:
        if it.get("i") in by_id:
            continue
        first_word = re.sub(r"[^a-z0-9]", "", (it.get("n") or "").strip().lower().split(" ")[0])
        if len(first_word) >= 5 and first_word not in seen_tokens:
            seen_tokens.add(first_word)
            brand_tokens.append(first_word)
        if len(brand_tokens) >= 400:
            break

    added_brand = 0

    def worker_brand(tok):
        return tok, fetch_wikimedia_brand_image(tok)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for tok, url in pool.map(worker_brand, brand_tokens):
            if url:
                with LOCK:
                    by_kw[tok] = url
                    added_brand += 1

    # Propagate newly discovered brand keywords across all 26,615+ items
    for item in items:
        iid = item.get("i", "")
        if not iid or iid in by_id:
            continue
        name_l = (item.get("n") or "").lower()
        for kw, url in by_kw.items():
            if kw in name_l:
                by_id[iid] = url
                break

    with open(IMAGES_PATH, "w", encoding="utf-8") as f:
        json.dump(img_store, f, ensure_ascii=False, indent=2)

    print(f"Completed! Total mapped IDs: {len(by_id)}, barcode hits: {added_barcode}, brand hits: {added_brand}")


if __name__ == "__main__":
    main()
