"""Import reviewed garment-only demo photos into Supabase, without resetting orders.

Run from server/: .venv/Scripts/python.exe scripts/seed_cutouts.py
Only the known sample catalogue and Demo Customer wardrobe are updated.
Original records are backed up locally before the first write. Photos are kept
in versioned object paths so existing uploads remain recoverable.
"""
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import json
import hashlib
from pathlib import Path
import sys
from uuid import NAMESPACE_URL, uuid5

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'server'))
from app.core.config import settings
from app.services.photo_assets import display_photo


def uid(value):
    return str(uuid5(NAMESPACE_URL, value))


def main():
    records = json.loads((ROOT / 'server/scripts/fixtures/cutout_catalogue.json').read_text())
    assets = ROOT / 'server/scripts/fixtures/cutouts'
    assert all((assets / (row['asset'] + '.png')).exists() for row in records)
    assert all((assets / (row['asset'] + '.png')).stat().st_size < 5 * 1024 * 1024 for row in records), 'Photo exceeds the storage limit'
    source_photos = {asset: (assets / (asset + '.png')).read_bytes() for asset in {row['asset'] for row in records}}
    photos = {asset: display_photo(content) for asset, content in source_photos.items()}
    filenames = {asset: asset + '-' + hashlib.sha256(content).hexdigest()[:12] + '.webp' for asset, content in photos.items()}
    print(json.dumps({'original_bytes': sum(map(len, source_photos.values())), 'optimized_bytes': sum(map(len, photos.values())), 'largest_photo_bytes': max(map(len, photos.values()))}), flush=True)
    base = settings.supabase_url.rstrip('/')
    key = settings.supabase_secret_key.get_secret_value()
    with httpx.Client(base_url=base, timeout=90, headers={'apikey': key, 'Authorization': 'Bearer ' + key}) as client:
        def request(method, path, **kwargs):
            for attempt in range(3):
                try:
                    response = client.request(method, path, **kwargs)
                    if response.status_code >= 500 and attempt < 2:
                        continue
                    break
                except httpx.TransportError:
                    if attempt == 2:
                        raise RuntimeError(f'{method} {path.split("?")[0]} failed after three network attempts') from None
            if response.is_error:
                raise RuntimeError(f'{method} {path.split("?")[0]} failed ({response.status_code}): {response.text[:200]}')
            return response.json() if response.content else None

        config = dotenv_values(ROOT / 'server/.env.demo-access')
        users = request('GET', '/rest/v1/users', params={'email': 'eq.' + config['DEMO_EMAIL'], 'select': 'user_id'})
        user_id = users[0]['user_id']
        previous_products = request('GET', '/rest/v1/products', params={'select': '*'})
        previous_variants = request('GET', '/rest/v1/product_variants', params={'select': '*'})
        previous_wardrobe = request('GET', '/rest/v1/wardrobe_items', params={'user_id': 'eq.' + user_id})
        backup = ROOT / 'server/.env.cutout-backup.json'
        if not backup.exists():
            backup.write_text(json.dumps({'products': previous_products, 'variants': previous_variants, 'wardrobe': previous_wardrobe}, indent=2))

        def upload(asset):
            object_key = f'clothing-cutouts-v2/{filenames[asset]}'
            request('POST', '/storage/v1/object/products/' + object_key, content=photos[asset],
                    headers={'Content-Type': 'image/webp', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000'})
            return asset, base + '/storage/v1/object/public/products/' + object_key

        with ThreadPoolExecutor(max_workers=4) as pool:
            urls = dict(pool.map(upload, sorted({row['asset'] for row in records})))
        products = []
        new_variants = []
        existing_ids = {row['product_id'] for row in previous_products}
        for row in records:
            product_id = uid('stylefit/' + row['slug'])
            products.append({'product_id': product_id, 'name': row['name'], 'category_id': row['category'],
                             'clothing_type': row['kind'], 'department': row['department'], 'style': row['style'], 'pattern': row['pattern'], 'is_active': True,
                             'description': 'An everyday casual piece from the coordinated essentials collection.'})
            if product_id not in existing_ids:
                for size in row['sizes']:
                    new_variants.append({'variant_id': uid(f"stylefit/{row['slug']}/{size}"), 'product_id': product_id,
                                         'size': size, 'color': row['color'], 'price': row['price'], 'stock_quantity': 20,
                                         'image_url': urls[row['asset']], 'is_active': True})
        request('POST', '/rest/v1/products', headers={'Prefer': 'resolution=merge-duplicates'}, json=products)
        if new_variants:
            request('POST', '/rest/v1/product_variants', headers={'Prefer': 'resolution=ignore-duplicates'}, json=new_variants)

        def update_variants(row):
            request('PATCH', '/rest/v1/product_variants', params={'product_id': 'eq.' + uid('stylefit/' + row['slug'])},
                    json={'image_url': urls[row['asset']], 'color': row['color']})
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(update_variants, records))

        # Keep the ten original wardrobe IDs, then fill each category to five.
        wardrobe_rows = []
        used = set()
        for kind in ['t-shirts', 'shirts', 'hoodies', 'jeans', 'pants', 'shorts', 'skirts', 'dresses', 'shoes', 'hats']:
            row = next(row for row in records if row['kind'] == kind)
            used.add(row['slug'])
            wardrobe_rows.append((uid(f'stylefit/demo/{user_id}/{kind}'), row))
        for category in ['tops', 'bottoms', 'dresses', 'shoes', 'hats']:
            needed = 5 - sum(row['category'] == category for _, row in wardrobe_rows)
            candidates = [row for row in records if row['category'] == category and row['slug'] not in used]
            for row in candidates[:needed]:
                wardrobe_rows.append((uid(f"stylefit/demo/{user_id}/cutout/{row['slug']}"), row))

        def save_wardrobe(pair):
            item_id, row = pair
            object_key = f"{user_id}/cutout-v2-{filenames[row['asset']]}"
            request('POST', '/storage/v1/object/wardrobe/' + object_key, content=photos[row['asset']],
                    headers={'Content-Type': 'image/webp', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000'})
            request('POST', '/rest/v1/wardrobe_items', headers={'Prefer': 'resolution=merge-duplicates'}, json={
                'wardrobe_item_id': item_id, 'user_id': user_id, 'name': row['name'], 'category_id': row['category'],
                'clothing_type': row['kind'], 'department': row['department'], 'color': row['color'], 'size': '40' if row['category'] == 'shoes' else 'One size' if row['category'] == 'hats' else 'M',
                'style': row['style'], 'pattern': row['pattern'], 'image_url': object_key})
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(save_wardrobe, wardrobe_rows))

        live = request('GET', '/rest/v1/products', params={'is_active': 'eq.true', 'select': 'category_id,product_variants(image_url)'})
        wardrobe = request('GET', '/rest/v1/wardrobe_items', params={'user_id': 'eq.' + user_id, 'select': 'category_id,image_url'})
        counts = Counter(row['category_id'] for row in live)
        wardrobe_counts = Counter(row['category_id'] for row in wardrobe)
        assert all(counts[category] >= 5 and wardrobe_counts[category] >= 5 for category in ['tops', 'bottoms', 'dresses', 'shoes', 'hats'])
        print(json.dumps({'catalogue': dict(counts), 'demo_wardrobe': dict(wardrobe_counts), 'uploaded_unique_photos': len(urls)}, indent=2))


if __name__ == '__main__':
    main()
