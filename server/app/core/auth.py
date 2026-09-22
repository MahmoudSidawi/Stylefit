from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import database

bearer = HTTPBearer(auto_error=False)


@dataclass
class Identity:
    user_id: str
    token: str


async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Identity:
    if not credentials:
        raise HTTPException(401, "Sign in to continue.", headers={"WWW-Authenticate": "Bearer"})
    # Supabase Auth verifies the token against this project's signing configuration.
    result = await database.request("GET", "auth/v1/user", token=credentials.credentials)
    try:
        user_id = str(UUID(result["id"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(401, "Invalid session.") from exc
    return Identity(user_id, credentials.credentials)


async def admin_user(user: Identity = Depends(current_user)) -> Identity:
    rows = await database.request("GET", "rest/v1/users", user.token,
                                  params={"user_id": f"eq.{user.user_id}", "select": "role"})
    if not rows or rows[0]["role"] != "admin":
        raise HTTPException(403, "Administrator access required.")
    return user
