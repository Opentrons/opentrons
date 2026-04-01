"""Auth settings and access-control responses (``SimpleBody`` envelopes from robot auth-server)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

# Aligns with auth_server.settings.models.SettingsResponseData; ``extra`` allows new server fields.
_SETTINGS_CFG = ConfigDict(populate_by_name=True, extra="allow")


class SettingsData(BaseModel):
    """``data`` object for GET/PATCH/DELETE /auth/settings."""

    model_config = _SETTINGS_CFG

    max_number_of_login_attempts: int | None = Field(
        default=5,
        alias="maxNumberOfLoginAttempts",
    )
    password_reset_time: float | None = Field(default=None, alias="passwordResetTime")
    password_complexity_minimum_length: int | None = Field(
        default=None,
        alias="passwordComplexityMinimumLength",
    )
    password_complexity_special_characters: bool | None = Field(
        default=None,
        alias="passwordComplexitySpecialCharacters",
    )
    idle_logout: float = Field(default=180.0, alias="idleLogout")
    require_reason_for_interaction: bool = Field(
        default=True,
        alias="requireReasonForInteraction",
    )
    min_length_of_reason_for_interaction: int | None = Field(
        default=None,
        alias="minLengthOfReasonForInteraction",
    )


class AuthSettingsResponse(BaseModel):
    """Full JSON body for /auth/settings (wrapper with ``data``)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: SettingsData


class AccessControlData(BaseModel):
    """``data`` for GET /auth/settings/accessControlEnabled."""

    model_config = ConfigDict(populate_by_name=True)

    access_control_enabled: bool = Field(alias="accessControlEnabled")


class AccessControlSettingsResponse(BaseModel):
    """Full JSON body for /auth/settings/accessControlEnabled."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: AccessControlData
