import json
from pathlib import Path
from uuid import UUID, uuid5, NAMESPACE_URL
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas.shop import Category, KINDS
from app.services import database
from app.core.config import settings

router = APIRouter(prefix='/api', tags=['Catalogue'])
fixtures = json.loads((Path(__file__).resolve().parents[1] / 'data/catalogue.json').read_text())


def sample_products():
    return [{
        'product_id': str(uuid5(NAMESPACE_URL, f'stylefit/{p["id"]}')),
        'name': p['name'], 'description': p['description'], 'category_id': p['category'],
        'slug': p['id'], 'clothing_type': p['kind'], 'style': p.get('style', 'casual'), 'pattern': p.get('pattern', 'solid'), 'is_active': True,
        'product_variants': [{
            'variant_id': str(uuid5(NAMESPACE_URL, f'stylefit/{p["id"]}/{size}')),
            'size': size, 'color': p['color'], 'price': p['price'],
            'stock_quantity': 20, 'image_url': p['image'], 'is_active': True,
        } for size in p['sizes']],
    } for p in fixtures]


@router.get('/categories')
async def categories():
    if database.configured():
        rows = await database.request('GET', 'rest/v1/categories', params={'select': '*', 'order': 'category_id'})
        return [{**row, 'clothing_types': KINDS[row['category_id']]} for row in rows]
    return [{'category_id': key, 'name': key.title(), 'clothing_types': kinds} for key, kinds in KINDS.items()]


@router.get('/products')
async def products(category: Category | None = None, q: str = Query('', max_length=100),
                   size: str | None = Query(None, max_length=120), color: str | None = Query(None, max_length=120),
                   min_price: float = Query(0, ge=0, allow_inf_nan=False), max_price: float | None = Query(None, gt=0, allow_inf_nan=False),
                   sort: Literal['name', 'price_asc', 'price_desc'] = 'name',
                   limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    if max_price is not None and min_price > max_price:
        raise HTTPException(422, 'Minimum price cannot exceed maximum price.')
    if not database.configured():
        if not settings.sample_catalogue_enabled:
            raise HTTPException(503, 'The catalogue is not configured.')
        items = [p for p in sample_products() if (not category or p['category_id'] == category)
                 and q.strip().casefold() in p['name'].casefold()
                 and any((not size or v['size'] == size) and (not color or v['color'] == color)
                         and v['price'] >= min_price and (max_price is None or v['price'] <= max_price)
                         for v in p['product_variants'])]
        items.sort(key=lambda p: (p['name'], p['product_id']) if sort == 'name'
                   else (min(v['price'] for v in p['product_variants']) * (-1 if sort == 'price_desc' else 1), p['product_id']))
        return {'items': items[offset:offset + limit], 'total': len(items), 'mode': 'sample', 'limit': limit, 'offset': offset}
    result = await database.request('POST', 'rest/v1/rpc/browse_products', body={
        'p_category': category, 'p_query': q.strip(), 'p_size': size, 'p_color': color,
        'p_min_price': min_price, 'p_max_price': max_price, 'p_sort': sort, 'p_limit': limit, 'p_offset': offset,
    })
    return {**result, 'mode': 'live', 'limit': limit, 'offset': offset}


@router.get('/products/{product_id}')
async def product(product_id: UUID):
    if not database.configured():
        if not settings.sample_catalogue_enabled:
            raise HTTPException(503, 'The catalogue is not configured.')
        rows = [p for p in sample_products() if p['product_id'] == str(product_id)]
    else:
        rows = await database.request('GET', 'rest/v1/products', params={
            'product_id': f'eq.{product_id}', 'select': '*,product_variants!inner(*)',
            'is_active': 'eq.true', 'product_variants.is_active': 'eq.true'})
    if not rows:
        raise HTTPException(404, 'Product not found.')
    return rows[0]
