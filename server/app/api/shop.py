from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.auth import Identity, current_user, admin_user
from app.schemas.shop import (CartUpdate, Checkout, OrderUpdate, ProductCreate, ProductInput,
                              ProfileUpdate, VariantInput, WardrobeInput, WishlistAdd)
from app.services import database as db
from app.schemas.shop import CartVariantChange, CategoryUpdate, Category

router = APIRouter(prefix='/api', tags=['Shop'])


async def owned(table, user, select='*', **filters):
    return await db.request('GET', f'rest/v1/{table}', user.token,
                            params={'user_id': f'eq.{user.user_id}', 'select': select, **filters})


@router.get('/me')
async def me(user: Identity = Depends(current_user)):
    rows = await owned('users', user)
    if not rows:
        raise HTTPException(404, 'Profile not found. Apply the user migration.')
    return rows[0]


@router.patch('/me')
async def update_me(body: ProfileUpdate, user: Identity = Depends(current_user)):
    return await db.request('PATCH', 'rest/v1/users', user.token,
                            params={'user_id': f'eq.{user.user_id}'}, body=body.model_dump(exclude_unset=True))


@router.get('/cart')
async def cart(user: Identity = Depends(current_user)):
    return await owned('cart_items', user, '*,product_variants(*,products(*))')


@router.put('/cart')
async def set_cart(body: CartUpdate, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/rpc/set_cart_item', user.token,
                            body={'p_variant_id': str(body.variant_id), 'p_quantity': body.quantity})


@router.post('/cart/add')
async def add_cart(body: CartUpdate, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/rpc/add_cart_item', user.token,
                            body={'p_variant_id': str(body.variant_id), 'p_quantity': body.quantity})


@router.post('/cart/change-variant')
async def change_cart_variant(body: CartVariantChange, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/rpc/change_cart_variant', user.token,
                            body={'p_from_variant': str(body.from_variant_id), 'p_to_variant': str(body.to_variant_id)})


@router.delete('/cart/{variant_id}', status_code=204)
async def remove_cart(variant_id: UUID, user: Identity = Depends(current_user)):
    await db.request('POST', 'rest/v1/rpc/set_cart_item', user.token,
                     body={'p_variant_id': str(variant_id), 'p_quantity': 0})
    return Response(status_code=204)


@router.get('/wishlist')
async def wishlist(user: Identity = Depends(current_user)):
    return await owned('wishlist_items', user, '*,products(*,product_variants(*))')


@router.post('/wishlist', status_code=201)
async def add_wishlist(body: WishlistAdd, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/wishlist_items', user.token,
                            params={'on_conflict': 'user_id,product_id'},
                            body={'user_id': user.user_id, 'product_id': str(body.product_id)},
                            prefer='resolution=ignore-duplicates,return=representation')


@router.delete('/wishlist/{product_id}', status_code=204)
async def remove_wishlist(product_id: UUID, user: Identity = Depends(current_user)):
    await db.request('DELETE', 'rest/v1/wishlist_items', user.token,
                     params={'user_id': f'eq.{user.user_id}', 'product_id': f'eq.{product_id}'})
    return Response(status_code=204)


@router.get('/wardrobe')
async def wardrobe(user: Identity = Depends(current_user)):
    return await owned('wardrobe_items', user, order='created_at.desc')


@router.get('/wardrobe/{item_id}')
async def wardrobe_item(item_id: UUID, user: Identity = Depends(current_user)):
    rows = await owned('wardrobe_items', user, wardrobe_item_id=f'eq.{item_id}')
    if not rows:
        raise HTTPException(404, 'Wardrobe item not found.')
    return rows[0]


def wardrobe_body(body, user):
    parts = body.image_url.split('/')
    if len(parts) != 2 or parts[0] != user.user_id or not parts[1] or '..' in parts[1]:
        raise HTTPException(422, 'Use an image uploaded to your own wardrobe folder.')
    return body.model_dump()


@router.post('/wardrobe', status_code=201)
async def add_wardrobe(body: WardrobeInput, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/wardrobe_items', user.token,
                            body={**wardrobe_body(body, user), 'user_id': user.user_id})


@router.put('/wardrobe/{item_id}')
async def update_wardrobe(item_id: UUID, body: WardrobeInput, user: Identity = Depends(current_user)):
    rows = await db.request('PATCH', 'rest/v1/wardrobe_items', user.token,
                            params={'user_id': f'eq.{user.user_id}', 'wardrobe_item_id': f'eq.{item_id}'},
                            body=wardrobe_body(body, user))
    if not rows:
        raise HTTPException(404, 'Wardrobe item not found.')
    return rows[0]


@router.delete('/wardrobe/{item_id}', status_code=204)
async def delete_wardrobe(item_id: UUID, user: Identity = Depends(current_user)):
    rows = await owned('wardrobe_items', user, wardrobe_item_id=f'eq.{item_id}')
    if not rows:
        raise HTTPException(404, 'Wardrobe item not found.')
    # Storage API performs physical deletion; SQL deletion of storage.objects would not.
    await db.request('DELETE', 'storage/v1/object/wardrobe', user.token,
                     body={'prefixes': [rows[0]['image_url']]})
    await db.request('DELETE', 'rest/v1/wardrobe_items', user.token,
                     params={'user_id': f'eq.{user.user_id}', 'wardrobe_item_id': f'eq.{item_id}'})
    return Response(status_code=204)


@router.get('/orders')
async def orders(user: Identity = Depends(current_user)):
    return await owned('orders', user, '*,order_items(*)', order='created_at.desc')


@router.get('/orders/{order_id}')
async def order_detail(order_id: UUID, user: Identity = Depends(current_user)):
    rows = await owned('orders', user, '*,order_items(*)', order_id=f'eq.{order_id}')
    if not rows:
        raise HTTPException(404, 'Order not found.')
    return rows[0]


@router.post('/orders', status_code=201)
async def checkout(body: Checkout, user: Identity = Depends(current_user)):
    return await db.request('POST', 'rest/v1/rpc/place_order', user.token,
                            body={f'p_{key}': value for key, value in body.model_dump().items()})


@router.get('/admin/products')
async def admin_products(user: Identity = Depends(admin_user)):
    return await db.request('GET', 'rest/v1/products', user.token,
                            params={'select': '*,product_variants(*)', 'order': 'name'})


@router.post('/admin/products', status_code=201)
async def create_product(body: ProductCreate, user: Identity = Depends(admin_user)):
    return await db.request('POST', 'rest/v1/rpc/create_product', user.token,
                            body={'p_product': body.model_dump(mode='json', exclude={'variants'}),
                                  'p_variants': [v.model_dump(mode='json') for v in body.variants]})


@router.put('/admin/products/{product_id}')
async def update_product(product_id: UUID, body: ProductInput, user: Identity = Depends(admin_user)):
    rows = await db.request('PATCH', 'rest/v1/products', user.token,
                            params={'product_id': f'eq.{product_id}'}, body=body.model_dump())
    if not rows:
        raise HTTPException(404, 'Product not found.')
    return rows[0]


@router.post('/admin/products/{product_id}/variants', status_code=201)
async def create_variant(product_id: UUID, body: VariantInput, user: Identity = Depends(admin_user)):
    return await db.request('POST', 'rest/v1/product_variants', user.token,
                            body={'product_id': str(product_id), **body.model_dump(mode='json')})


@router.put('/admin/variants/{variant_id}')
async def update_variant(variant_id: UUID, body: VariantInput, user: Identity = Depends(admin_user)):
    rows = await db.request('PATCH', 'rest/v1/product_variants', user.token,
                            params={'variant_id': f'eq.{variant_id}'}, body=body.model_dump(mode='json'))
    if not rows:
        raise HTTPException(404, 'Variant not found.')
    return rows[0]


@router.get('/admin/orders')
async def admin_orders(user: Identity = Depends(admin_user)):
    return await db.request('GET', 'rest/v1/orders', user.token,
                            params={'select': '*,order_items(*)', 'order': 'created_at.desc'})


@router.patch('/admin/orders/{order_id}')
async def update_order(order_id: UUID, body: OrderUpdate, user: Identity = Depends(admin_user)):
    return await db.request('POST', 'rest/v1/rpc/update_order_status', user.token,
                            body={'p_order_id': str(order_id), 'p_status': body.status, 'p_is_paid': body.is_paid})


@router.patch('/admin/categories/{category_id}')
async def update_category(category_id: Category, body: CategoryUpdate, user: Identity = Depends(admin_user)):
    return await db.request('PATCH', 'rest/v1/categories', user.token,
                            params={'category_id': f'eq.{category_id}'}, body=body.model_dump())
