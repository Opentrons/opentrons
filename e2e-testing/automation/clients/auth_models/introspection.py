"""RFC 7662 token introspection response (POST /auth/oauth2/introspect)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class TokenIntrospectionResponse(BaseModel):
    """Parsed introspection JSON.

    Inactive tokens are typically ``{"active": false}``. Active tokens add
    fields such as ``scope`` and ``username`` (this server omits ``active`` in
    the dict passed to oauthlib, which adds ``active: true``).
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    active: bool
    scope: str | None = None
    username: str | None = None
    client_id: str | None = None
    token_type: str | None = None
    exp: int | None = None
    iat: int | None = None
    sub: str | None = None
    aud: str | None = None
    iss: str | None = None
    nbf: int | None = None
