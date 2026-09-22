from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.main import app
from app.core.config import settings
from app.services import database
from io import BytesIO
from PIL import Image

USER = str(uuid4())
OTHER = str(uuid4())
AUTH = {'Authorization': 'Bearer valid-token'}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, 'supabase_url', None)
    monkeypatch.setattr(settings, 'supabase_publishable_key', None)
    with TestClient(app) as client:
        yield client


def mock_db(monkeypatch, responses):
    mock = AsyncMock(side_effect=responses)
    monkeypatch.setattr(database, 'request', mock)
    return mock


def test_basic_catalogue_filters_pagination(client):
    assert [c['name'] for c in client.get('/api/categories').json()] == ['Tops', 'Bottoms', 'Dresses']
    result = client.get('/api/products?category=tops').json()
    assert result['mode'] == 'sample'
    assert {p['clothing_type'] for p in result['items']} == {'t-shirts', 'shirts', 'hoodies'}
    assert len(client.get('/api/products?category=bottoms').json()['items']) == 12
    assert len(client.get('/api/products?category=dresses').json()['items']) == 3
    result = client.get('/api/products?q=SHIRT&limit=1&offset=1').json()
    assert len(result['items']) == 1
    product = result['items'][0]
    assert client.get('/api/products/' + product['product_id']).json() == product
    assert client.get('/api/products?category=shoes').status_code == 422
    assert client.get('/api/products?limit=101').status_code == 422
    assert client.get('/api/products/' + str(uuid4())).status_code == 404


@pytest.mark.parametrize('path', ['/api/me', '/api/cart', '/api/wishlist', '/api/wardrobe', '/api/orders', '/api/admin/orders'])
def test_protected_routes_require_auth(client, path):
    assert client.get(path).status_code == 401


def test_unconfigured_protected_route_is_not_a_fake_success(client):
    assert client.get('/api/cart', headers=AUTH).status_code == 503


def test_cart_uses_verified_identity_and_rpc(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, None])
    variant = str(uuid4())
    result = client.put('/api/cart', headers=AUTH, json={'variant_id': variant, 'quantity': 2})
    assert result.status_code == 200
    assert mock.call_args.args == ('POST', 'rest/v1/rpc/set_cart_item', 'valid-token')
    assert mock.call_args.kwargs['body'] == {'p_variant_id': variant, 'p_quantity': 2}


@pytest.mark.parametrize('quantity', [0, -1, 100, 1.5, True, '2'])
def test_cart_rejects_invalid_quantities(client, monkeypatch, quantity):
    mock_db(monkeypatch, [{'id': USER}])
    assert client.put('/api/cart', headers=AUTH, json={'variant_id': str(uuid4()), 'quantity': quantity}).status_code == 422


def test_customer_cannot_access_admin(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}, [{'role': 'customer'}]])
    assert client.get('/api/admin/orders', headers=AUTH).status_code == 403


def test_profile_cannot_change_role_or_identity(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}])
    assert client.patch('/api/me', headers=AUTH, json={'name': 'Test', 'role': 'admin'}).status_code == 422


def test_wardrobe_cannot_reference_other_users_photo(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}])
    result = client.post('/api/wardrobe', headers=AUTH, json={
        'name': 'Shirt', 'category_id': 'tops', 'image_url': f'{OTHER}/photo.jpg'})
    assert result.status_code == 422


def test_owned_reads_filter_by_verified_user(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, []])
    assert client.get('/api/orders', headers=AUTH).status_code == 200
    assert mock.call_args.kwargs['params']['user_id'] == f'eq.{USER}'


def test_checkout_never_accepts_client_price(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}])
    result = client.post('/api/orders', headers=AUTH, json={
        'recipient_name': 'Customer', 'phone': '+961 1234567',
        'delivery_address': 'Street 123, Beirut', 'total_amount': 1})
    assert result.status_code == 422


def test_checkout_uses_transaction(client, monkeypatch):
    order_id = str(uuid4())
    mock = mock_db(monkeypatch, [{'id': USER}, order_id])
    result = client.post('/api/orders', headers=AUTH, json={
        'recipient_name': 'Customer', 'phone': '+961 1234567', 'delivery_address': 'Street 123, Beirut'})
    assert result.status_code == 201
    assert result.json() == order_id
    assert mock.call_args.args[1] == 'rest/v1/rpc/place_order'


def test_wrong_clothing_type_rejected(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}, [{'role': 'admin'}]])
    result = client.post('/api/admin/products', headers=AUTH, json={
        'name': 'Shirt', 'category_id': 'dresses', 'clothing_type': 'shirts',
        'variants': [{'size': 'M', 'color': 'White', 'price': '25.00', 'stock_quantity': 5, 'image_url': '/clothes/basic-tee.svg'}]})
    assert result.status_code == 422


def test_gateway_verifies_token_with_auth_and_does_not_use_secret(client, monkeypatch):
    monkeypatch.setattr(settings, 'supabase_url', 'https://project.example')
    monkeypatch.setattr(settings, 'supabase_publishable_key', SecretStr('public-key'))
    seen = []

    def handler(request):
        seen.append(request)
        assert request.headers['apikey'] == 'public-key'
        assert request.headers['authorization'] == 'Bearer valid-token'
        if request.url.path == '/auth/v1/user':
            return httpx.Response(200, json={'id': USER})
        return httpx.Response(200, json=[])

    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    assert client.get('/api/cart', headers=AUTH).status_code == 200
    assert [r.url.path for r in seen] == ['/auth/v1/user', '/rest/v1/cart_items']


def test_invalid_token_stops_before_database(client, monkeypatch):
    monkeypatch.setattr(settings, 'supabase_url', 'https://project.example')
    monkeypatch.setattr(settings, 'supabase_publishable_key', SecretStr('public-key'))
    seen = []

    def handler(request):
        seen.append(request.url.path)
        return httpx.Response(401, json={'message': 'bad jwt'})

    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    assert client.get('/api/cart', headers=AUTH).status_code == 401
    assert seen == ['/auth/v1/user']


def test_upload_validates_image_content_and_uses_owned_key(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, {'Key': 'uploaded'}])
    image = BytesIO()
    Image.new('RGB', (4, 4), 'white').save(image, 'PNG')
    result = client.post('/api/wardrobe/images', headers=AUTH, files={'file': ('photo.png', image.getvalue(), 'image/png')})
    assert result.status_code == 201
    assert result.json()['image_url'].startswith(USER + '/')
    assert mock.call_args.kwargs['content_type'] == 'image/png'


@pytest.mark.parametrize(('content', 'mime', 'expected'), [
    (b'not an image', 'image/png', 422), (b'<svg/>', 'image/svg+xml', 415),
    (b'x' * (5 * 1024 * 1024 + 1), 'image/png', 413),
], ids=['invalid-bytes', 'unsupported-type', 'oversize'])
def test_invalid_upload_never_reaches_storage(client, monkeypatch, content, mime, expected):
    mock = mock_db(monkeypatch, [{'id': USER}])
    response = client.post('/api/wardrobe/images', headers=AUTH, files={'file': ('photo', content, mime)})
    assert response.status_code == expected
    assert mock.call_count == 1


def test_private_image_not_found_does_not_sign(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, []])
    assert client.get(f'/api/wardrobe/{uuid4()}/image', headers=AUTH).status_code == 404
    assert mock.call_count == 2


def test_catalogue_fixture_agrees_with_frontend():
    import json
    from pathlib import Path
    root = Path(__file__).resolve().parents[2]
    assert json.loads((root / 'client/src/features/products/data/catalogue.json').read_text()) == json.loads(
        (root / 'server/app/data/catalogue.json').read_text())
