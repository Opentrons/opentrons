"""User resource shapes from /auth/users (JSON:API-style ``data`` payloads)."""

from __future__ import annotations

from typing import Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field

# Mirrors auth_server/users (and settings account types).
AccountType = Literal["admin", "user", "auditor", "service"]

# PATCH ``locked`` only accepts JSON false or null (clear lockout), never true.
UserPatchLocked = Literal[False] | None


class UserCreateData(TypedDict):
    """Inner ``data`` for POST **requests** to ``/auth/users``.

    All fields are required in JSON. Matches ``auth_server.users.models.UserCreate``.
    """

    username: str
    password: str
    fullName: str
    accountType: AccountType


class UserCreateRequestEnvelope(TypedDict):
    """Top-level **request** JSON for POST ``/auth/users``."""

    data: UserCreateData


class UserPatchData(TypedDict, total=False):
    """Inner ``data`` for PATCH **requests** to ``/auth/users/byUsername/{username}``.

    Only include keys being updated. JSON null is represented as ``None``; omit
    keys you do not want to change. Matches ``auth_server.users.models.UpdateUser``.
    """

    username: str | None
    password: str | None
    fullName: str | None
    accountType: AccountType | None
    locked: UserPatchLocked
    resetPassword: bool


class UserPatchRequestEnvelope(TypedDict):
    """Top-level **request** JSON for PATCH ``/auth/users/byUsername/{username}``."""

    data: UserPatchData


class UserResponse(BaseModel):
    """User inside response ``data`` for GET/POST/PATCH ``/auth/users/...`` (**responses**)."""

    model_config = ConfigDict(populate_by_name=True)

    user_name: str = Field(alias="username")
    full_name: str = Field(alias="fullName")
    account_type: AccountType = Field(alias="accountType")
    scopes: list[str] = Field(default_factory=list)
    locked: bool
    reset_password: bool = Field(alias="resetPassword")


class UserResourceResponse(BaseModel):
    """Top-level **response** JSON for single-user endpoints (``{"data": {...}}``)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: UserResponse
