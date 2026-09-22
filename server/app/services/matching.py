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
                if photo.format not in ('JPEG', 'PNG') or photo.width * photo.height > 25_000_000:
                    raise ValueError('Invalid image')
                picture = ImageOps.exif_transpose(photo).convert('RGB')
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
