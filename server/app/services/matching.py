import base64
from io import BytesIO
from urllib.parse import quote
import warnings

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

from app.core.auth import Identity
from app.schemas.matching import MatchRequest, StoreSelection
from app.services import database

PROFILE_FIELDS = ('height_cm', 'weight_kg', 'body_shape', 'clothing_size', 'skin_tone')


def normalize_photo(content: bytes) -> str:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as photo:
                if photo.format not in ('JPEG', 'PNG', 'WEBP') or photo.width * photo.height > 25_000_000:
                    raise ValueError('Invalid image')
                rgba = ImageOps.exif_transpose(photo).convert('RGBA')
                picture = Image.new('RGB', rgba.size, 'white')
                picture.paste(rgba, mask=rgba.getchannel('A'))
                picture.thumbnail((1024, 1024))
                output = BytesIO()
                picture.save(output, format='JPEG', quality=85)
        return 'data:image/jpeg;base64,' + base64.b64encode(output.getvalue()).decode('ascii')
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(422, 'A selected photo cannot be read. Replace it with a clear JPG or PNG.') from exc


async def wardrobe_record(item_id, user: Identity) -> dict:
    rows = await database.request('GET', 'rest/v1/wardrobe_items', user.token, params={
        'wardrobe_item_id': f'eq.{item_id}', 'user_id': f'eq.{user.user_id}',
        'select': 'wardrobe_item_id,name,category_id,clothing_type,color,style,pattern,material,size,image_url',
    })
    if not rows:
        raise HTTPException(404, 'A selected wardrobe item is unavailable.')
    return rows[0]


async def wardrobe_photo(record: dict, user: Identity) -> str:
    # Fixed project/bucket path and verified owner; no caller-supplied URL is fetched.
    key = record['image_url']
    if not key.startswith(user.user_id + '/') or '..' in key or len(key.split('/')) != 2:
        raise HTTPException(403, 'This wardrobe photo is unavailable.')
    content = await database.download(f'storage/v1/object/authenticated/wardrobe/{quote(key, safe="/")}', user.token)
    return await run_in_threadpool(normalize_photo, content)


async def selected_items(body: MatchRequest, user: Identity):
    items, wardrobe = [], []
    seen_products = set()
    for index, selection in enumerate(body.items):
        if isinstance(selection, StoreSelection):
            rows = await database.request('GET', 'rest/v1/product_variants', user.token, params={
                'variant_id': f'eq.{selection.variant_id}', 'is_active': 'eq.true',
                'products.is_active': 'eq.true',
                'select': 'size,color,product_id,products!inner(name,description,category_id,clothing_type,style,pattern)',
            })
            if not rows:
                raise HTTPException(404, 'A selected store variant is unavailable.')
            variant = rows[0]
            if variant['product_id'] in seen_products:
                raise HTTPException(422, 'Choose different products rather than multiple sizes of one product.')
            seen_products.add(variant['product_id'])
            product = variant['products']
            items.append({'item': index + 1, 'source': 'store', 'size': variant['size'], 'color': variant['color'],
                          **{key: product.get(key) for key in ('name', 'description', 'category_id', 'clothing_type', 'style', 'pattern')}})
        else:
            record = await wardrobe_record(selection.wardrobe_item_id, user)
            items.append({'item': index + 1, 'source': 'wardrobe',
                          **{key: record.get(key) for key in ('name', 'category_id', 'clothing_type', 'color', 'style', 'pattern', 'material', 'size')}})
            wardrobe.append((index + 1, record))
    categories = {item.get('category_id') for item in items}
    if 'dresses' in categories and categories.intersection({'tops', 'bottoms'}):
        raise HTTPException(422, 'A dress cannot be combined with tops or bottoms. Remove one before checking the outfit.')
    # Resolve ownership of ALL selections before downloading or transmitting any photo.
    images = []
    for index, record in wardrobe:
        images.append(await wardrobe_photo(record, user))
        items[index - 1]['image_number'] = len(images)
    profile = {}
    if body.include_profile:
        rows = await database.request('GET', 'rest/v1/users', user.token, params={
            'user_id': f'eq.{user.user_id}', 'select': ','.join(PROFILE_FIELDS)})
        if rows:
            profile = {key: rows[0].get(key) for key in PROFILE_FIELDS if rows[0].get(key) is not None}
    return items, images, profile


async def style_history(user: Identity) -> dict:
    saved = await database.request('GET', 'rest/v1/wishlist_items', user.token, params={
        'user_id': f'eq.{user.user_id}', 'limit': '20', 'order': 'created_at.desc',
        'select': 'products(name,category_id,clothing_type,style,pattern)',
    })
    orders = await database.request('GET', 'rest/v1/orders', user.token, params={
        'user_id': f'eq.{user.user_id}', 'status': 'neq.cancelled', 'limit': '10',
        'order': 'created_at.desc', 'select': 'order_items(product_name,color,size)',
    })
    # No identity, delivery, payment details or private photos enter the history prompt.
    saved_items = [{key: row['products'].get(key) for key in ('name', 'category_id', 'clothing_type', 'style', 'pattern')}
                   for row in saved if row.get('products')]
    ordered_items = [{key: item.get(key) for key in ('product_name', 'color', 'size')}
                     for order in orders for item in order.get('order_items', [])][:40]
    return {'saved_items': saved_items, 'ordered_items': ordered_items,
            'saved_count': len(saved_items), 'order_count': len(orders)}


async def recommendation_candidates(user: Identity, items: list[dict], profile: dict) -> list[dict]:
    rows = await database.request('GET', 'rest/v1/product_variants', user.token, params={
        'is_active': 'eq.true', 'stock_quantity': 'gt.0', 'products.is_active': 'eq.true',
        'limit': '300', 'order': 'product_id,size',
        'select': 'variant_id,product_id,size,color,image_url,products!inner(name,category_id,clothing_type,style,pattern)',
    })
    selected_names = {item.get('name') for item in items}
    choices = {}
    for row in rows:
        product = row['products']
        if product['name'] in selected_names:
            continue
        key = row['product_id']
        if key not in choices or row['size'] == profile.get('clothing_size'):
            choices[key] = {'candidate_id': row['variant_id'], **row, **product}
    return list(choices.values())[:60]


def resolve_recommendations(suggestions, candidates: list[dict]) -> list[dict]:
    available = {str(item['candidate_id']): item for item in candidates}
    result, seen = [], set()
    for suggestion in suggestions:
        key = str(suggestion.candidate_id)
        if key not in available or key in seen:
            continue
        seen.add(key)
        item = available[key]
        result.append({field: str(item[field]) for field in ('variant_id', 'product_id', 'name', 'image_url', 'size', 'color')} | {'reason': suggestion.reason})
    return result
