import json
from io import BytesIO
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from pydantic import SecretStr

from app.main import app
from app.core.auth import current_user, Identity
from app.core.config import settings
from app.services import database, groq_ai, matching
from app.schemas.matching import MatchAnalysis

USER = str(uuid4())
V1, V2, W1 = str(uuid4()), str(uuid4()), str(uuid4())
DIMENSION = {'score': 85, 'explanation': 'The selected pieces work well together.'}
ANALYSIS = {'score': 85, 'explanation': 'A balanced everyday outfit with coordinated colors.',
            **{key: DIMENSION for key in ['colors', 'styles', 'patterns', 'clothing_types', 'occasion']},
            'suggestions': ['Try a relaxed top for a softer silhouette.']}


@pytest.fixture
def client(monkeypatch):
    app.dependency_overrides[current_user] = lambda: Identity(USER, 'verified-token')
    monkeypatch.setattr(settings, 'groq_api_key', SecretStr('test-key'))
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def store(product_id=None):
    return [{'product_id': product_id or str(uuid4()), 'size': 'M', 'color': 'white',
             'products': {'name': 'Basic shirt', 'description': 'Cotton shirt', 'category_id': 'tops',
                          'clothing_type': 'shirts', 'style': 'casual', 'pattern': 'solid'}}]


def body(**changes):
    return {'items': [{'source': 'store', 'variant_id': V1}, {'source': 'store', 'variant_id': V2}], **changes}


def mock_db(monkeypatch, values):
    mock = AsyncMock(side_effect=values)
    monkeypatch.setattr(database, 'request', mock)
    return mock


def mock_ai(monkeypatch):
    mock = AsyncMock(return_value=MatchAnalysis(**ANALYSIS))
    monkeypatch.setattr(groq_ai, 'complete', mock)
    return mock


def test_store_match_is_real_provider_result_without_profile(client, monkeypatch):
    db = mock_db(monkeypatch, [True, store(), store()])
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body())
    assert result.status_code == 200
    assert result.json()['score'] == 85
    assert result.json()['provider'] == 'groq'
    assert result.json()['used_profile'] is False
    assert result.json()['images_analyzed'] == 0
    assert ai.call_args.args[1]['optional_profile'] == {}
    assert len(db.call_args_list) == 3
    assert USER not in json.dumps(ai.call_args.args[1])
    assert 'verified-token' not in json.dumps(ai.call_args.args[1])


def test_missing_key_never_calls_database_or_ai(client, monkeypatch):
    monkeypatch.setattr(settings, 'groq_api_key', None)
    db = mock_db(monkeypatch, [])
    assert client.post('/api/matches', json=body()).status_code == 503
    db.assert_not_called()


def test_limit_is_shared_and_rejects_without_provider_call(client, monkeypatch):
    mock_db(monkeypatch, [False])
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body())
    assert result.status_code == 429
    assert result.headers['retry-after'] == '60'
    ai.assert_not_called()


def test_other_users_wardrobe_fails_before_any_photo_or_ai(client, monkeypatch):
    db = mock_db(monkeypatch, [True, store(), []])
    photo = AsyncMock()
    monkeypatch.setattr(database, 'download', photo)
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body(items=[{'source': 'store', 'variant_id': V1}, {'source': 'wardrobe', 'wardrobe_item_id': W1}]))
    assert result.status_code == 404
    assert db.call_args.kwargs['params']['user_id'] == f'eq.{USER}'
    ai.assert_not_called()
    photo.assert_not_called()


def test_profile_opt_in_whitelists_fields(client, monkeypatch):
    db = mock_db(monkeypatch, [True, store(), store(), [{'height_cm': 170, 'name': 'PRIVATE', 'email': 'PRIVATE', 'skin_tone': 'olive'}]])
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body(include_profile=True))
    assert result.status_code == 200
    assert ai.call_args.args[1]['optional_profile'] == {'height_cm': 170, 'skin_tone': 'olive'}
    assert 'email' not in db.call_args.kwargs['params']['select']
    assert 'PRIVATE' not in json.dumps(ai.call_args.args[1])


@pytest.mark.parametrize('items', [[], [{'source': 'store', 'variant_id': V1}],
    [{'source': 'store', 'variant_id': V1}] * 2,
    [{'source': 'store', 'variant_id': str(uuid4())} for _ in range(6)]])
def test_selection_validation(client, monkeypatch, items):
    ai = mock_ai(monkeypatch)
    assert client.post('/api/matches', json=body(items=items)).status_code == 422
    ai.assert_not_called()


def test_same_product_different_sizes_rejected(client, monkeypatch):
    row = store()
    mock_db(monkeypatch, [True, row, row])
    ai = mock_ai(monkeypatch)
    assert client.post('/api/matches', json=body()).status_code == 422
    ai.assert_not_called()


@pytest.mark.parametrize('sources', [('store', 'store'), ('wardrobe', 'store'), ('store', 'wardrobe'), ('wardrobe', 'wardrobe')])
@pytest.mark.parametrize(('category', 'kind'), [('bottoms', 'jeans'), ('tops', 'shirts'), ('tops', 'hoodies')])
def test_dress_conflicts_rejected_before_photos_or_ai(client, monkeypatch, sources, category, kind):
    records, selections = [], []
    for source, category, kind in zip(sources, ['dresses', category], ['dresses', kind]):
        record = {'name': kind, 'category_id': category, 'clothing_type': kind, 'image_url': f'{USER}/{kind}.jpg'}
        if source == 'store':
            row = store()
            row[0]['products'].update(record)
        else:
            row = [record]
        records.append(row)
        selections.append({'source': source, 'variant_id' if source == 'store' else 'wardrobe_item_id': str(uuid4())})
    mock_db(monkeypatch, [True, *records])
    photo = AsyncMock()
    monkeypatch.setattr(database, 'download', photo)
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body(items=selections))
    assert result.status_code == 422
    assert 'dress' in result.json()['detail'].lower()
    photo.assert_not_called()
    ai.assert_not_called()


def test_top_jeans_shoes_hat_match_can_include_four_items(client, monkeypatch):
    rows = []
    for category in ['tops', 'bottoms', 'shoes', 'hats']:
        row = store()
        row[0]['products']['category_id'] = category
        rows.append(row)
    mock_db(monkeypatch, [True, *rows])
    mock_ai(monkeypatch)
    selections = [{'source': 'store', 'variant_id': str(uuid4())} for _ in rows]
    assert client.post('/api/matches', json=body(items=selections)).status_code == 200


def test_optimized_webp_is_accepted_for_ai_and_alpha_is_white():
    from app.services.matching import normalize_photo
    import base64
    image = BytesIO()
    Image.new('RGBA', (4, 4), (0, 0, 0, 0)).save(image, 'WEBP')
    encoded = normalize_photo(image.getvalue()).split(',', 1)[1]
    with Image.open(BytesIO(base64.b64decode(encoded))) as photo:
        assert photo.getpixel((0, 0)) == (255, 255, 255)


def test_wardrobe_photo_is_normalized_and_sent_only_after_ownership_check(client, monkeypatch):
    mock_db(monkeypatch, [True, store(), [{'name': 'Jeans', 'image_url': f'{USER}/jeans.png', 'category_id': 'bottoms'}]])
    buffer = BytesIO()
    Image.new('RGB', (1200, 100), 'blue').save(buffer, 'PNG')
    monkeypatch.setattr(database, 'download', AsyncMock(return_value=buffer.getvalue()))
    ai = mock_ai(monkeypatch)
    result = client.post('/api/matches', json=body(items=[{'source': 'store', 'variant_id': V1}, {'source': 'wardrobe', 'wardrobe_item_id': W1}]))
    assert result.status_code == 200
    assert result.json()['images_analyzed'] == 1
    assert ai.call_args.args[2][0].startswith('data:image/jpeg;base64,')


@pytest.mark.parametrize(('status', 'expected'), [(401, 503), (403, 503), (404, 503), (429, 429), (500, 502)])
def test_provider_errors_are_redacted(client, monkeypatch, status, expected):
    mock_db(monkeypatch, [True, store(), store()])
    original = httpx.AsyncClient
    transport = httpx.MockTransport(lambda request: httpx.Response(status, json={'error': 'PRIVATE SECRET'}))
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=transport, **kwargs))
    result = client.post('/api/matches', json=body())
    assert result.status_code == expected
    assert 'SECRET' not in result.text
    assert 'score' not in result.json()


@pytest.mark.parametrize('content', ['not JSON', json.dumps({**ANALYSIS, 'score': 101}), json.dumps({**ANALYSIS, 'score': True}), '{}'])
def test_malformed_provider_output_never_becomes_a_score(client, monkeypatch, content):
    mock_db(monkeypatch, [True, store(), store()])
    original = httpx.AsyncClient
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': content}}]}))
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=transport, **kwargs))
    assert client.post('/api/matches', json=body()).status_code == 502


def test_timeout_does_not_fabricate_result(client, monkeypatch):
    mock_db(monkeypatch, [True, store(), store()])
    def timeout(request):
        raise httpx.ReadTimeout('timeout', request=request)
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(timeout), **kwargs))
    assert client.post('/api/matches', json=body()).status_code == 504


def test_real_payload_contract(client, monkeypatch):
    mock_db(monkeypatch, [True, store(), store()])
    def handler(request):
        assert str(request.url) == 'https://api.groq.com/openai/v1/chat/completions'
        assert request.headers['authorization'] == 'Bearer test-key'
        payload = json.loads(request.content)
        assert payload['model'] == settings.groq_model
        assert payload['response_format'] == {'type': 'json_object'}
        assert 'tools' not in payload
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(ANALYSIS)}}]})
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    assert client.post('/api/matches', json=body()).status_code == 200


def test_match_requires_verified_auth(monkeypatch):
    app.dependency_overrides.clear()
    with TestClient(app) as client:
        assert client.post('/api/matches', json=body()).status_code == 401
