from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_local_client_cors_preflight() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/health",
            headers={
                "Origin": settings.client_origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == settings.client_origin
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_unlisted_origin_is_not_allowed() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/health",
            headers={
                "Origin": "https://unlisted.example",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers

