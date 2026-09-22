"""Supabase gateway. Every data request runs under the caller's RLS identity."""
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings


def configured() -> bool:
    return bool(settings.supabase_url and 'your-project' not in settings.supabase_url
                and settings.supabase_publishable_key
                and settings.supabase_publishable_key.get_secret_value().strip())


async def request(method: str, path: str, token: str | None = None,
                  params: dict | None = None, body: Any = None,
                  prefer: str = "return=representation", content: bytes | None = None,
                  content_type: str | None = None) -> Any:
    if not configured():
        raise HTTPException(503, "Configure Supabase and apply the database migrations first.")
    headers = {"apikey": settings.supabase_publishable_key.get_secret_value(), "Prefer": prefer}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if content_type:
        headers["Content-Type"] = content_type
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(method, f"{settings.supabase_url.rstrip('/')}/{path}",
                                            headers=headers, params=params,
                                            **({'content': content} if content is not None else {'json': body}))
    except httpx.RequestError as exc:
        raise HTTPException(503, "The data service is unavailable. Please retry.") from exc
    if response.is_error:
        try:
            error = response.json()
        except ValueError:
            error = {}
        if not isinstance(error, dict):
            error = {}
        code = error.get("code")
        # Only expose our own business errors, never database internals or credentials.
        if code == "P0001":
            raise HTTPException(409, error.get("message", "The operation could not be completed."))
        status = {"23505": 409, "23503": 409, "23514": 422, "42501": 403}.get(code)
        status = status or (response.status_code if response.status_code in (401, 403, 404) else 502)
        raise HTTPException(status, {401: "Invalid or expired session.", 403: "Access denied.",
                                     404: "Not found.", 409: "This change conflicts with existing data.",
                                     422: "Invalid data."}.get(status, "The data service could not complete the request."))
    try:
        return response.json() if response.content else None
    except ValueError as exc:
        raise HTTPException(502, 'The data service returned an unreadable response.') from exc


async def download(path: str, token: str, max_bytes: int = 5 * 1024 * 1024) -> bytes:
    if not configured():
        raise HTTPException(503, 'Configure Supabase first.')
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            async with client.stream('GET', f'{settings.supabase_url.rstrip("/")}/{path}', headers={
                'apikey': settings.supabase_publishable_key.get_secret_value(), 'Authorization': f'Bearer {token}',
            }) as response:
                if response.status_code in (401, 403, 404):
                    raise HTTPException(404, 'A wardrobe image is missing or inaccessible.')
                if response.is_error:
                    raise HTTPException(503, 'Image storage is temporarily unavailable.')
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > max_bytes:
                        raise HTTPException(413, 'The selected image is too large.')
                return bytes(content)
    except httpx.RequestError as exc:
        raise HTTPException(503, 'The selected image could not be loaded. Please retry.') from exc
