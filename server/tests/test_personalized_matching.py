from uuid import uuid4
from unittest.mock import AsyncMock

from test_matching import client, store, body, mock_db, ANALYSIS, USER
from app.schemas.matching import MatchAnalysis
from app.services import groq_ai


def test_history_is_owner_scoped_minimal_and_recommendations_are_inventory_validated(client, monkeypatch):
    variant, invented = str(uuid4()), str(uuid4())
    saved = [{'products': {'name': 'Oxford shirt', 'style': 'classic', 'category_id': 'tops',
                           'clothing_type': 'shirts', 'pattern': 'solid', 'private': 'DO NOT SEND'}}]
    orders = [{'phone': 'DO NOT SEND', 'order_items': [{'product_name': 'Grey trousers', 'size': 'M', 'color': 'grey', 'private': 'DO NOT SEND'}]}]
    candidates = [{'variant_id': variant, 'product_id': str(uuid4()), 'size': 'M', 'color': 'ivory',
                   'image_url': 'https://example.test/shirt.png', 'products': saved[0]['products']}]
    db = mock_db(monkeypatch, [True, store(), store(), saved, orders, candidates])
    ai = AsyncMock(return_value=MatchAnalysis(**ANALYSIS, personalization_note='Your saved shirt suggests an interest in classic styles.', recommended_items=[
        {'candidate_id': variant, 'reason': 'A structured shirt suits the office.'},
        {'candidate_id': invented, 'reason': 'An invented product must not be displayed.'},
        {'candidate_id': variant, 'reason': 'Duplicate product must not appear twice.'},
    ]))
    monkeypatch.setattr(groq_ai, 'complete', ai)
    result = client.post('/api/matches', json=body(include_history=True, include_recommendations=True))
    assert result.status_code == 200, result.text
    data = result.json()
    assert data['score'] == ANALYSIS['score']
    assert data['used_history'] is True
    assert data['history_saved_count'] == 1 and data['history_order_count'] == 1
    assert [row['variant_id'] for row in data['recommendations']] == [variant]
    for call in db.call_args_list[3:5]:
        assert call.kwargs['params']['user_id'] == f'eq.{USER}'
    assert db.call_args_list[4].kwargs['params']['status'] == 'neq.cancelled'
    assert db.call_args_list[5].kwargs['params']['stock_quantity'] == 'gt.0'
    payload = ai.call_args.args[1]
    assert 'DO NOT SEND' not in str(payload)
    assert 'image_url' not in str(payload['available_candidates'])
    assert USER not in str(payload)


def test_empty_history_is_not_reported_as_personalization(client, monkeypatch):
    mock_db(monkeypatch, [True, store(), store(), [], []])
    monkeypatch.setattr(groq_ai, 'complete', AsyncMock(return_value=MatchAnalysis(**ANALYSIS)))
    result = client.post('/api/matches', json=body(include_history=True))
    assert result.status_code == 200
    assert result.json()['used_history'] is False
    assert result.json()['recommendations'] == []
