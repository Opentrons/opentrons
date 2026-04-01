"""Pydantic models for auth-server HTTP responses (e2e-testing client)."""

from __future__ import annotations

from automation.clients.auth_models.introspection import TokenIntrospectionResponse
from automation.clients.auth_models.oauth import TokenResponse
from automation.clients.auth_models.openapi import OpenApiDocument, OpenApiInfo
from automation.clients.auth_models.settings import (
    AccessControlData,
    AccessControlSettingsResponse,
    AuthSettingsResponse,
    SettingsData,
)
from automation.clients.auth_models.user import AccountType, UserResourceResponse, UserResponse

__all__ = [
    "AccessControlData",
    "AccessControlSettingsResponse",
    "AccountType",
    "AuthSettingsResponse",
    "OpenApiDocument",
    "OpenApiInfo",
    "SettingsData",
    "TokenIntrospectionResponse",
    "TokenResponse",
    "UserResourceResponse",
    "UserResponse",
]
