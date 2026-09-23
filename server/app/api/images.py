from io import BytesIO
from uuid import UUID, uuid4
import warnings

from fastapi import APIRouter, Depends, HTTPException, UploadFile, Response
from PIL import Image, UnidentifiedImageError  # type: ignore[import-not-found]

from app.core.auth import Identity, current_user, admin_user
from app.core.config import settings
from app.services import database
from app.services.photo_assets import display_photo
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix='/api', tags=['Images'])
MAX_BYTES = 5 * 1024 * 1024


async def validated_upload(file: UploadFile):
    content = await file.read(MAX_BYTES + 1)
    await file.close()
    if len(content) > MAX_BYTES:
        raise HTTPException(413, 'Images must be 5 MB or smaller.')
    if file.content_type not in ('image/jpeg', 'image/png'):
        raise HTTPException(415, 'Upload a JPG or PNG image.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as picture:
                image_format = picture.format
                if image_format not in ('JPEG', 'PNG') or picture.width * picture.height > 25_000_000:
                    raise ValueError('Unsupported image')
                picture.verify()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(422, 'This image cannot be read. Choose a valid JPG or PNG under 25 megapixels.') from exc
    return await run_in_threadpool(display_photo, content), 'webp', 'image/webp'


@router.post('/wardrobe/images', status_code=201)
async def upload_image(file: UploadFile, user: Identity = Depends(current_user)):
    content, extension, mime = await validated_upload(file)
    key = f'{user.user_id}/{uuid4()}.{extension}'
    await database.request('POST', f'storage/v1/object/wardrobe/{key}', user.token, content=content, content_type=mime)
    return {'image_url': key}


@router.get('/wardrobe/{item_id}/image')
async def signed_image(item_id: UUID, user: Identity = Depends(current_user)):
    rows = await database.request('GET', 'rest/v1/wardrobe_items', user.token,
                                  params={'user_id': f'eq.{user.user_id}', 'wardrobe_item_id': f'eq.{item_id}', 'select': 'image_url'})
    if not rows:
        raise HTTPException(404, 'Wardrobe item not found.')
    from urllib.parse import quote
    result = await database.request('POST', f'storage/v1/object/sign/wardrobe/{quote(rows[0]["image_url"], safe="/")}',
                                    user.token, body={'expiresIn': 300})
    return {'url': f'{settings.supabase_url.rstrip("/")}/storage/v1{result["signedURL"]}', 'expires_in': 300}


@router.post('/admin/images', status_code=201)
async def upload_product_image(file: UploadFile, user: Identity = Depends(admin_user)):
    content, extension, mime = await validated_upload(file)
    key = f'{uuid4()}.{extension}'
    await database.request('POST', f'storage/v1/object/products/{key}', user.token, content=content, content_type=mime)
    return {'image_url': f'{settings.supabase_url.rstrip("/")}/storage/v1/object/public/products/{key}'}


@router.delete('/wardrobe/images/{filename}', status_code=204)
async def delete_unused_image(filename: str, user: Identity = Depends(current_user)):
    if '/' in filename or '..' in filename or not filename:
        raise HTTPException(422, 'Invalid image name.')
    key = f'{user.user_id}/{filename}'
    rows = await database.request('GET', 'rest/v1/wardrobe_items', user.token,
                                  params={'user_id': f'eq.{user.user_id}', 'image_url': f'eq.{key}', 'select': 'wardrobe_item_id'})
    if rows:
        raise HTTPException(409, 'This photo is still used by a wardrobe item.')
    await database.request('DELETE', 'storage/v1/object/wardrobe', user.token, body={'prefixes': [key]})
    return Response(status_code=204)
