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
        # Gateway tests install their own transport after startup.
        monkeypatch.setattr(database, "_shared_client", None)
        yield client


def mock_db(monkeypatch, responses):
    mock = AsyncMock(side_effect=responses)
    monkeypatch.setattr(database, 'request', mock)
    return mock


def test_catalogue_requires_database_instead_of_sample_fallback(client):
    for path in ['/api/categories', '/api/products', '/api/products/' + str(uuid4()), '/api/content/storefront']:
        assert client.get(path).status_code == 503
    assert client.get('/api/products?category=invalid').status_code == 422
    assert client.get('/api/products?limit=101').status_code == 422


def test_catalogue_passes_filters_to_database(client, monkeypatch):
    db = mock_db(monkeypatch, [{'items': [], 'total': 0}])
    result = client.get('/api/products?category=shoes&q=runner&limit=5&offset=10')
    assert result.status_code == 200
    assert result.json()['mode'] == 'live'
    assert db.call_args.kwargs['body']['p_category'] == 'shoes'
    assert db.call_args.kwargs['body']['p_offset'] == 10
    assert db.call_args.kwargs['body']['p_query'] == 'runner'


def test_saved_look_checks_ownership_and_persists(client, monkeypatch):
    wardrobe_id = str(uuid4())
    payload = {'name': 'Weekend outfit', 'occasion': 'weekend', 'selection': [{'garmentId': wardrobe_id, 'size': 'M'}]}
    db = mock_db(monkeypatch, [{'id': USER}, [{'category_id': 'tops'}], [{'id': str(uuid4()), **payload}]])
    response = client.post('/api/looks', headers=AUTH, json=payload)
    assert response.status_code == 201
    assert db.call_args_list[1].kwargs['params']['user_id'] == f'eq.{USER}'
    assert db.call_args.kwargs['body']['user_id'] == USER
    assert db.call_args.kwargs['body']['selection'] == payload['selection']


def test_saved_look_cannot_reference_another_users_garment(client, monkeypatch):
    db = mock_db(monkeypatch, [{'id': USER}, []])
    response = client.post('/api/looks', headers=AUTH, json={'name': 'Unavailable look', 'occasion': 'weekend',
        'selection': [{'garmentId': str(uuid4()), 'size': 'M'}]})
    assert response.status_code == 404
    assert db.call_count == 2


def test_saved_look_database_failure_is_not_reported_as_saved(client, monkeypatch):
    from fastapi import HTTPException
    mock_db(monkeypatch, [{'id': USER}, [{'category_id': 'tops'}], HTTPException(503, 'Database unavailable')])
    assert client.post('/api/looks', headers=AUTH, json={'name': 'Weekend outfit', 'occasion': 'weekend',
        'selection': [{'garmentId': str(uuid4()), 'size': 'M'}]}).status_code == 503


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



@pytest.mark.parametrize('path', ['/api/admin/me', '/api/admin/users'])
def test_customer_cannot_access_admin_accounts(client, monkeypatch, path):
    mock = mock_db(monkeypatch, [{'id': USER}, [{'role': 'customer'}]])
    assert client.get(path, headers=AUTH).status_code == 403
    assert mock.call_count == 2


def test_admin_can_update_customer_name(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, [{'role': 'admin'}], [{'user_id': OTHER, 'name': 'Updated'}]])
    assert client.patch(f'/api/admin/users/{OTHER}', headers=AUTH, json={'name': 'Updated'}).status_code == 200
    assert mock.call_args.kwargs['body'] == {'name': 'Updated'}
    assert mock.call_args.kwargs['params']['user_id'] == f'eq.{OTHER}'


def test_admin_user_update_rejects_role_and_password(client, monkeypatch):
    mock_db(monkeypatch, [{'id': USER}, [{'role': 'admin'}]])
    assert client.patch(f'/api/admin/users/{OTHER}', headers=AUTH,
                        json={'name': 'Updated', 'role': 'admin', 'password': 'secret'}).status_code == 422


def test_admin_user_listing_uses_narrow_server_privilege(client, monkeypatch):
    mock = mock_db(monkeypatch, [{'id': USER}, [{'role': 'admin'}], []])
    assert client.get('/api/admin/users', headers=AUTH).status_code == 200
    assert mock.call_args.kwargs['admin_profiles'] is True
    assert mock.call_args.kwargs['params']['select'] == 'user_id,name,email,role'


def test_admin_profiles_gateway_keeps_server_secret_off_customer_requests(client, monkeypatch):
    monkeypatch.setattr(settings, 'supabase_url', 'https://project.example')
    monkeypatch.setattr(settings, 'supabase_publishable_key', SecretStr('public-key'))
    monkeypatch.setattr(settings, 'supabase_secret_key', SecretStr('server-secret'))
    seen = []

    def handler(request):
        seen.append(request)
        if request.url.path == '/auth/v1/user':
            assert request.headers['apikey'] == 'public-key'
            return httpx.Response(200, json={'id': USER})
        if request.url.params.get('select') == 'role':
            assert request.headers['authorization'] == 'Bearer valid-token'
            return httpx.Response(200, json=[{'role': 'admin'}])
        assert request.url.path == '/rest/v1/users'
        assert request.headers['apikey'] == 'server-secret'
        return httpx.Response(200, json=[])

    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    assert client.get('/api/admin/users', headers=AUTH).status_code == 200
    assert len(seen) == 3


def test_admin_me_fetches_profile_once(client, monkeypatch):
    profile = {'user_id': USER, 'role': 'admin', 'name': 'Admin'}
    mock = mock_db(monkeypatch, [{'id': USER}, [profile]])
    response = client.get('/api/admin/me', headers=AUTH)
    assert response.status_code == 200
    assert response.json() == profile
    assert mock.call_count == 2


def test_pooled_gateway_reuses_connection_without_sharing_identity(monkeypatch):
    monkeypatch.setattr(settings, 'supabase_url', 'https://project.example')
    monkeypatch.setattr(settings, 'supabase_publishable_key', SecretStr('public-key'))
    tokens = []
    clients = []
    def handler(request):
        tokens.append(request.headers['authorization'])
        if request.url.path == '/auth/v1/user':
            return httpx.Response(200, json={'id': USER})
        return httpx.Response(200, json=[])
    original = httpx.AsyncClient
    def create(**kwargs):
        instance = original(transport=httpx.MockTransport(handler), **kwargs)
        clients.append(instance)
        return instance
    monkeypatch.setattr(httpx, 'AsyncClient', create)
    with TestClient(app) as test_client:
        assert test_client.get('/api/cart', headers={'Authorization': 'Bearer first'}).status_code == 200
        assert test_client.get('/api/cart', headers={'Authorization': 'Bearer second'}).status_code == 200
        assert len(clients) == 1
    assert clients[0].is_closed
    assert tokens == ['Bearer first', 'Bearer first', 'Bearer second', 'Bearer second']
