"""Auth settings shapes for the e2e-testing auth client.

JSON uses camelCase keys, matching ``auth_server.settings.models``. Request and
response types are separate: ``SettingsPatchData`` / ``SettingsPatchRequestEnvelope``
for PATCH bodies vs ``SettingsResponseData`` / ``SettingsResponseEnvelope`` for
GET and successful PATCH/DELETE responses.

PATCH ``data`` semantics: omit a key to leave that setting unchanged; JSON null
(``None`` here) clears or disables where the API allows; a normal value sets the
field. Response types do not encode server defaults like
``maxNumberOfLoginAttempts == 5``; validation only checks shape.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field


class SettingsResponseData(TypedDict):
    """``data`` object in **responses** for GET/PATCH/DELETE ``/auth/settings``."""

    maxNumberOfLoginAttempts: int | None
    passwordResetTime: float | None
    passwordComplexityMinimumLength: int | None
    passwordComplexitySpecialCharacters: bool | None
    idleLogout: float
    requireReasonForInteraction: bool
    minLengthOfReasonForInteraction: int | None
    requireAdminCredsWhenUpdatingRobotSoftware: bool
    requireAdminCredsWhenSendingProtocolToRobot: bool
    requireAdminCredsForSignoffProtocol: bool


class SettingsResponseEnvelope(TypedDict):
    """Top-level **response** JSON for GET/PATCH/DELETE ``/auth/settings``."""

    data: SettingsResponseData


class SettingsPatchData(TypedDict, total=False):
    """Inner ``data`` object for PATCH **requests** to ``/auth/settings``.

    Include only keys you want to change. Aligns with
    ``auth_server.settings.models.PatchSettingsRequestData`` (patchable fields only).
    """

    maxNumberOfLoginAttempts: int | None
    passwordResetTime: float | None
    passwordComplexityMinimumLength: int | None
    passwordComplexitySpecialCharacters: bool | None
    idleLogout: float | None
    requireAdminCredsWhenUpdatingRobotSoftware: bool | None
    requireAdminCredsWhenSendingProtocolToRobot: bool | None
    requireAdminCredsForSignoffProtocol: bool | None
    requireReasonForInteraction: bool | None
    minLengthOfReasonForInteraction: int | None


class SettingsPatchRequestEnvelope(TypedDict):
    """Top-level **request** JSON for PATCH ``/auth/settings`` (``{"data": ...}``)."""

    data: SettingsPatchData


class AccessControlPatchData(TypedDict):
    """Inner ``data`` for PATCH ``/auth/settings/accessControlEnabled`` (valid body)."""

    accessControlEnabled: Literal[True]


class AccessControlPatchRequestEnvelope(TypedDict):
    """Top-level **request** JSON for PATCH ``/auth/settings/accessControlEnabled``."""

    data: AccessControlPatchData


class AccessControlInvalidPatchData(TypedDict):
    """Inner ``data`` the API rejects (only ``true`` is accepted); for negative tests."""

    accessControlEnabled: Literal[False]


class AccessControlInvalidPatchRequestEnvelope(TypedDict):
    """Envelope for an invalid PATCH ``/auth/settings/accessControlEnabled`` body."""

    data: AccessControlInvalidPatchData


class AccessControlResponseData(BaseModel):
    """``data`` in **responses** for GET/PATCH ``/auth/settings/accessControlEnabled``."""

    model_config = ConfigDict(populate_by_name=True)

    access_control_enabled: bool = Field(alias="accessControlEnabled")


class AccessControlResponseEnvelope(BaseModel):
    """Top-level **response** JSON for GET/PATCH ``/auth/settings/accessControlEnabled``."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: AccessControlResponseData
