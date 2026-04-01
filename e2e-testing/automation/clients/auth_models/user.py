"""User resource shapes from /auth/users (JSON:API-style ``data`` payloads)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Mirrors auth_server/users (and settings account types).
AccountType = Literal["admin", "user", "auditor", "service"]


class UserResponse(BaseModel):
    """User object inside response ``data`` for GET/POST/PATCH /auth/users/..."""

    model_config = ConfigDict(populate_by_name=True)

    user_name: str = Field(alias="userName")
    full_name: str = Field(alias="fullName")
    account_type: AccountType = Field(alias="accountType")
    scopes: list[str] = Field(default_factory=list)


class UserResourceResponse(BaseModel):
    """Full JSON body for user single-resource responses (``{"data": {...}}``)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: UserResponse
