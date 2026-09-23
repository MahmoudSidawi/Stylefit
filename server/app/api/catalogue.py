from uuid import UUID
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas.shop import Category, KINDS
from app.services import database

router = APIRouter(prefix='/api', tags=['Catalogue'])
@router.get('/categories')
async def categories():
    rows = await database.request('GET', 'rest/v1/categories', params={'select': '*', 'order': 'category_id'})
    return [{**row, 'clothing_types': KINDS.get(row['category_id'], [])} for row in rows]


@router.get('/products')
async def products(category: Category | None = None, q: str = Query('', max_length=100),
                   size: str | None = Query(None, max_length=120), color: str | None = Query(None, max_length=120),
                   min_price: float = Query(0, ge=0, allow_inf_nan=False), max_price: float | None = Query(None, gt=0, allow_inf_nan=False),
                   sort: Literal['name', 'price_asc', 'price_desc'] = 'name',
                   limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    if max_price is not None and min_price > max_price:
        raise HTTPException(422, 'Minimum price cannot exceed maximum price.')
    result = await database.request('POST', 'rest/v1/rpc/browse_products', body={
        'p_category': category, 'p_query': q.strip(), 'p_size': size, 'p_color': color,
        'p_min_price': min_price, 'p_max_price': max_price, 'p_sort': sort, 'p_limit': limit, 'p_offset': offset,
    })
    return {**result, 'mode': 'live', 'limit': limit, 'offset': offset}


@router.get('/products/{product_id}')
async def product(product_id: UUID):
    rows = await database.request('GET', 'rest/v1/products', params={
        'product_id': f'eq.{product_id}', 'select': '*,product_variants!inner(*)',
        'is_active': 'eq.true', 'product_variants.is_active': 'eq.true'})
    if not rows:
        raise HTTPException(404, 'Product not found.')
    return rows[0]


@router.get('/content/storefront')
async def storefront_content():
    rows = await database.request('GET', 'rest/v1/site_content', params={'key': 'eq.storefront', 'select': 'data'})
    if not rows:
        raise HTTPException(503, 'Storefront content has not been configured.')
    return rows[0]['data']
