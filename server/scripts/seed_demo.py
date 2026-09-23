"""Seed the requested demo account, photo catalogue and sample COD order.

Run manually from server/: .venv/Scripts/python.exe scripts/seed_demo.py
Requires the shoes/hats migration and the server-only Supabase secret key.
Reruns reuse the demo account, wardrobe records and order. No emails are sent.
"""
import json
from pathlib import Path
import secrets
import sys
from uuid import NAMESPACE_URL, uuid5

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'server'))
from app.core.config import settings


def uid(value):
    return str(uuid5(NAMESPACE_URL, value))


def main():
    key = settings.supabase_secret_key.get_secret_value()
    base = settings.supabase_url.rstrip('/')
    client = httpx.Client(base_url=base, timeout=45, headers={
        'apikey': key, 'Authorization': 'Bearer ' + key,
        'Prefer': 'return=representation',
    })

    def request(method, path, **kwargs):
        response = client.request(method, path, **kwargs)
        if response.is_error:
            # Never print request headers or Auth responses containing tokens.
            raise RuntimeError(f'{method} {path.split("?")[0]} failed ({response.status_code})')
        return response.json() if response.content else None

    categories = request('GET', '/rest/v1/categories')
    if not {'shoes', 'hats'} <= {row['category_id'] for row in categories}:
        raise SystemExit('Apply 202609230001_shoes_hats.sql first.')

    credentials = ROOT / 'server/.env.demo-access'
    if credentials.exists():
        config = dotenv_values(credentials)
        email, password = config['DEMO_EMAIL'], config['DEMO_PASSWORD']
    else:
        email, password = 'demo.customer@stylefit.test', secrets.token_urlsafe(18)
        credentials.write_text(f'DEMO_EMAIL={email}\nDEMO_PASSWORD={password}\n', encoding='utf-8')
    users = request('GET', '/rest/v1/users', params={'email': 'eq.' + email, 'select': 'user_id'})
    if users:
        user_id = users[0]['user_id']
    else:
        account = request('POST', '/auth/v1/admin/users', json={
            'email': email, 'password': password, 'email_confirm': True,
            'user_metadata': {'name': 'Demo Customer'},
        })
        user_id = account['id']
    session = request('POST', '/auth/v1/token?grant_type=password', json={'email': email, 'password': password})
    user_headers = {'apikey': settings.supabase_publishable_key.get_secret_value(),
                    'Authorization': 'Bearer ' + session['access_token']}

    fixtures = json.loads((ROOT / 'server/scripts/fixtures/catalogue.json').read_text(encoding='utf-8'))
    # Save the previous catalogue photo references locally before the first update.
    backup = ROOT / 'server/.env.demo-image-backup.json'
    if not backup.exists():
        rows = request('GET', '/rest/v1/product_variants', params={'select': 'variant_id,product_id,image_url'})
        backup.write_text(json.dumps(rows, indent=2), encoding='utf-8')
    photo_urls = {}
    for kind in ('t-shirts', 'shirts', 'hoodies', 'jeans', 'pants', 'shorts', 'skirts', 'dresses', 'shoes', 'hats'):
        content = (ROOT / f'client/public/clothes/photos/{kind}.jpg').read_bytes()
        request('POST', f'/storage/v1/object/products/demo-photos/{kind}.jpg', content=content,
                headers={'Content-Type': 'image/jpeg', 'x-upsert': 'true'})
        photo_urls[kind] = f'{base}/storage/v1/object/public/products/demo-photos/{kind}.jpg'
    updated = 0
    for product in fixtures:
        rows = request('PATCH', '/rest/v1/product_variants', params={'product_id': 'eq.' + uid('stylefit/' + product['id'])},
                       json={'image_url': photo_urls[product['kind']]})
        updated += len(rows)
    for slug, name, kind, color, sizes, price in [
        ('demo-running-shoes', 'Red Running Shoes', 'shoes', 'red', ['38', '39', '40', '41', '42'], 65),
        ('demo-baseball-cap', 'White Baseball Cap', 'hats', 'white', ['One size'], 19),
    ]:
        product_id = uid('stylefit/' + slug)
        request('POST', '/rest/v1/products', headers={'Prefer': 'resolution=ignore-duplicates'}, json={
            'product_id': product_id, 'name': name, 'category_id': kind, 'clothing_type': kind,
            'description': 'Sample catalogue item with a representative clothing photograph.',
            'style': 'casual', 'pattern': 'solid', 'is_active': True,
        })
        for size in sizes:
            request('POST', '/rest/v1/product_variants', headers={'Prefer': 'resolution=ignore-duplicates'}, json={
                'variant_id': uid(f'stylefit/{slug}/{size}'), 'product_id': product_id,
                'size': size, 'color': color, 'price': price, 'stock_quantity': 20, 'image_url': photo_urls[kind],
            })
    wardrobe = [
        ('White T-shirt', 'tops', 't-shirts', 'white', 'M'),
        ('Blue Patterned Shirt', 'tops', 'shirts', 'blue', 'M'),
        ('Grey Hoodie', 'tops', 'hoodies', 'grey', 'M'),
        ('Blue Jeans', 'bottoms', 'jeans', 'indigo', 'M'),
        ('Khaki Pants', 'bottoms', 'pants', 'camel', 'M'),
        ('Denim Shorts', 'bottoms', 'shorts', 'blue', 'M'),
        ('Black Skirt', 'bottoms', 'skirts', 'black', 'M'),
        ('Red Dress', 'dresses', 'dresses', 'red', 'M'),
        ('Red Running Shoes', 'shoes', 'shoes', 'red', '40'),
        ('White Baseball Cap', 'hats', 'hats', 'white', 'One size'),
    ]
    for name, category, kind, color, size in wardrobe:
        object_key = f'{user_id}/demo-{kind}.jpg'
        request('POST', '/storage/v1/object/wardrobe/' + object_key,
                content=(ROOT / f'client/public/clothes/photos/{kind}.jpg').read_bytes(),
                headers={'Content-Type': 'image/jpeg', 'x-upsert': 'true'})
        request('POST', '/rest/v1/wardrobe_items', headers={'Prefer': 'resolution=merge-duplicates'}, json={
            'wardrobe_item_id': uid(f'stylefit/demo/{user_id}/{kind}'), 'user_id': user_id,
            'name': name, 'category_id': category, 'clothing_type': kind, 'color': color,
            'size': size, 'style': 'casual', 'pattern': 'patterned' if kind == 'shirts' else 'solid',
            'image_url': object_key,
        })
    orders = request('GET', '/rest/v1/orders', headers=user_headers,
                     params={'user_id': 'eq.' + user_id, 'select': 'order_id'})
    if not orders:
        for slug, size in [('basic-tee', 'M'), ('straight-jeans', 'M'), ('demo-running-shoes', '40'), ('demo-baseball-cap', 'One size')]:
            request('POST', '/rest/v1/rpc/set_cart_item', headers=user_headers,
                    json={'p_variant_id': uid(f'stylefit/{slug}/{size}'), 'p_quantity': 1})
        order_id = request('POST', '/rest/v1/rpc/place_order', headers=user_headers, json={
            'p_recipient_name': 'Demo Customer - TEST ORDER', 'p_phone': '0000000000',
            'p_delivery_address': 'DEMO ONLY - No delivery. StyleFit sample account.',
        })
    else:
        order_id = orders[0]['order_id']
    result = {'email': email, 'user_id': user_id, 'wardrobe_items': len(wardrobe),
              'existing_variants_updated': updated, 'order': order_id,
              'credentials_file': 'server/.env.demo-access'}
    (ROOT / 'server/.env.demo-result.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
    client.close()


if __name__ == '__main__':
    main()
