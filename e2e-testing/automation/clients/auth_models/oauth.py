"""OAuth2 token endpoint responses (RFC 6749)."""

from __future__ import annotations

from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Successful token response from POST /auth/oauth2/token.

    The API uses snake_case keys in JSON (``access_token``, ``expires_in``, ...).
    """

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None = None
    scope: str = ""
