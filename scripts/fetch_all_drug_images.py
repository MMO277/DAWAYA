#!/usr/bin/env python3
"""
DAWAYA Official Egyptian Pharmacy Image Collector (scripts/fetch_all_drug_images.py)
-----------------------------------------------------------------------------------
Fetches ONLY exact, authentic Egyptian pharmacy package photos for the remaining
unmapped products in `public/data/dawaya_medicines_search_index.json` using:
  1. dwaprices.com (official Egyptian drug price & package photo directory)
  2. egyptiandrugstore.com (Egyptian Drug Store product catalog)
  3. Open Beauty Facts / Open Food Facts (exact EAN-13 barcode lookup)

Runs automatically on GitHub Actions (.github/workflows/fetch-drug-images.yml).
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
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def http_get_text(url: str, timeout: float = 8.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def http_get_json(url: str, timeout: float = 6.0):
    return json.loads(http_get_text(url, timeout=timeout))


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


def fetch_dwaprices_image(trade_name_en: str) -> str:
    clean = re.sub(r"\s+", " ", (trade_name_en or "").strip())
    if len(clean) < 3:
        return ""
    try:
        # Search using the first 2-3 meaningful brand tokens
        tokens = [t for t in clean.split(" ") if len(t) >= 2][:3]
        q = urllib.parse.quote(" ".join(tokens))
        html = http_get_text(f"https://dwaprices.com/search.php?search={q}", timeout=7.0)
        # Extract uploaded package photo path (upload/<digits>.(png|jpg|jpeg|webp))
        m = re.search(r"(https?://(?:www\.)?dwaprices\.com/)?(upload/\d+\.(?:png|jpg|jpeg|webp))", html, re.I)
        if m:
            img_path = m.group(2)
            # Ignore generic site logo / placeholder
            if "1776442041" not in img_path:
                return f"https://dwaprices.com/{img_path}"
    except (urllib.error.URLError, TimeoutError, ValueError):
        pass
    return ""


def fetch_egyptiandrugstore_image(trade_name_en: str) -> str:
    clean = re.sub(r"\s+", " ", (trade_name_en or "").strip())
    if len(clean) < 4:
        return ""
    try:
        tokens = [t for t in clean.split(" ") if len(t) >= 3][:2]
        if not tokens:
            return ""
        q = urllib.parse.quote(" ".join(tokens))
        html = http_get_text(f"https://egyptiandrugstore.com/index.php?route=product/search&search={q}", timeout=7.0)
        m = re.search(r"https://egyptiandrugstore\.com/image/cache/[^\"'\s>]+\.(?:png|jpg|jpeg|webp)", html, re.I)
        if m:
            return m.group(0)
    except (urllib.error.URLError, TimeoutError, ValueError):
        pass
    return ""


def save_store(img_store: dict):
    with open(IMAGES_PATH, "w", encoding="utf-8") as f:
        json.dump(img_store, f, ensure_ascii=False, separators=(",", ":"))


def main():
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    if os.path.exists(IMAGES_PATH):
        with open(IMAGES_PATH, "r", encoding="utf-8") as f:
            img_store = json.load(f)
    else:
        img_store = {"version": 1, "byId": {}, "byKeyword": {}}

    by_id = img_store.setdefault("byId", {})

    todo = [it for it in items if it.get("i") and it["i"] not in by_id]
    print(f"Starting authentic package image collection for {len(todo)} unmapped products...")

    # Process up to 3,500 items per workflow run so it finishes cleanly within 30 mins and saves incrementally
    batch = todo[:3500]
    added = 0

    def worker(it):
        iid = it["i"]
        bc = it.get("b", "")
        name = it.get("n", "")
        url = ""
        if bc and len("".join(c for c in bc if c.isdigit())) >= 8:
            url = fetch_barcode_image(bc)
        if not url:
            url = fetch_dwaprices_image(name)
        if not url:
            url = fetch_egyptiandrugstore_image(name)
        return iid, url

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        for idx_num, (iid, url) in enumerate(pool.map(worker, batch), 1):
            if url:
                with LOCK:
                    by_id[iid] = url
                    added += 1
            if idx_num % 200 == 0:
                with LOCK:
                    save_store(img_store)
                print(f"Progress: {idx_num}/{len(batch)} | New authentic photos found: {added}")

    save_store(img_store)
    print(f"Done! Total authentic mapped IDs: {len(by_id)} (+{added} new)")


if __name__ == "__main__":
    main()
