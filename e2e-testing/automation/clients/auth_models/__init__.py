"""Types for auth-server HTTP payloads (e2e-testing client)."""

from __future__ import annotations

from automation.clients.auth_models.introspection import TokenIntrospectionResponse
from automation.clients.auth_models.oauth import TokenResponse
from automation.clients.auth_models.openapi import OpenApiDocument, OpenApiInfo
from automation.clients.auth_models.settings import (
    AccessControlPatchData,
    AccessControlPatchRequestEnvelope,
    AccessControlResponseData,
    AccessControlResponseEnvelope,
    SettingsPatchData,
    SettingsPatchRequestEnvelope,
    SettingsResponseData,
    SettingsResponseEnvelope,
)
from automation.clients.auth_models.user import (
    AccountType,
    UserCreateData,
    UserCreateRequestEnvelope,
    UserPatchData,
    UserPatchLocked,
    UserPatchRequestEnvelope,
    UserResourceResponse,
    UserResponse,
)

__all__ = [
    "AccessControlPatchData",
    "AccessControlPatchRequestEnvelope",
    "AccessControlResponseData",
    "AccessControlResponseEnvelope",
    "AccountType",
    "OpenApiDocument",
    "OpenApiInfo",
    "SettingsPatchData",
    "SettingsPatchRequestEnvelope",
    "SettingsResponseData",
    "SettingsResponseEnvelope",
    "TokenIntrospectionResponse",
    "TokenResponse",
    "UserCreateData",
    "UserCreateRequestEnvelope",
    "UserPatchData",
    "UserPatchLocked",
    "UserPatchRequestEnvelope",
    "UserResourceResponse",
    "UserResponse",
]
