"""Request and response models for the `/settings` endpoints."""

from textwrap import dedent
from typing import Annotated, Literal

import pydantic

from auth_server.persistence.orm_models import Settings


class PasswordComplexity(pydantic.BaseModel):
    """The complexity of the password."""

    minimum_length: int
    special_characters: bool


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current settings.

    Field defaults define the system defaults for all settings.
    These are used to seed the database and to reset settings.
    Do not change them without coordinating.
    """

    accessControlEnabled: bool = pydantic.Field(
        default=False,
        description="When enabled, authorization is enforced throughout the robot's HTTP APIs. "
        "Protected endpoints are blocked unless the request carries an OAuth 2 access token "
        "with the appropriate scopes. See the `/auth/oauth2` endpoints. "
        "When disabled (the default), all endpoints allow unauthenticated access.",
    )
    max_number_of_login_attempts: int = pydantic.Field(
        default=5,
        description="Max number of login attempts before account deactivation.",
    )
    password_reset_time_in_days: int | None = pydantic.Field(
        default=None,
        description="Length of time in days until password must be changed.",
    )
    password_complexity: PasswordComplexity | None = pydantic.Field(
        default=None,
        description="Password complexity level.",
    )
    idle_lockout_in_minutes: int = pydantic.Field(
        default=3,
        description="Length of time until account is locked due to inactivity.",
    )
    require_admin_creds_when_updating_robot_software: bool = pydantic.Field(
        default=True,
        description="Require admin credentials when updating robot settings.",
    )
    require_admin_creds_when_sending_protocol_to_robot: bool = pydantic.Field(
        default=True,
        description="Require admin credentials when sending protocol to robot.",
    )
    require_admin_creds_for_signoff_protocol: bool = pydantic.Field(
        default=False,
        description="Require admin credentials for signoff protocol.",
    )
    require_signoff_for_protocol_log: bool = pydantic.Field(
        default=True,
        description="Require signoff for protocol log.",
    )
    require_reason_for_interaction: bool = pydantic.Field(
        default=True,
        description="Require reason for interaction.",
    )
    min_length_of_reason_for_interaction: int | None = pydantic.Field(
        default=None,
        description="Minimum length of reason for interaction.",
    )
    require_logs_to_be_saved_in_app: bool = pydantic.Field(
        default=True,
        description="Require logs to be saved in app. Path should be configured in the app.",
    )
    delete_over_max_on_disk_protocols: bool = pydantic.Field(
        default=True,
        description="Automatically delete protocol run logs on the robot when there are 20 protocol run records.",
    )

    @classmethod
    def from_orm_settings(cls, settings: Settings) -> "SettingsResponseData":
        """Build a SettingsResponseData from an ORM Settings."""
        assert settings.access_control_enabled is not None
        assert settings.max_number_of_login_attempts is not None
        assert settings.password_reset_time_in_days is not None
        assert settings.idle_lockout_in_minutes is not None
        assert settings.require_admin_creds_when_updating_robot_software is not None
        assert settings.require_admin_creds_when_sending_protocol_to_robot is not None
        assert settings.require_admin_creds_for_signoff_protocol is not None
        assert settings.require_signoff_for_protocol_log is not None
        assert settings.require_reason_for_interaction is not None
        assert settings.min_length_of_reason_for_interaction is not None
        assert settings.require_logs_to_be_saved_in_app is not None
        assert settings.delete_over_max_on_disk_protocols is not None
        assert settings.password_complexity_minimum_length is not None
        assert settings.password_complexity_special_characters is not None

        return cls(
            accessControlEnabled=settings.access_control_enabled,
            max_number_of_login_attempts=settings.max_number_of_login_attempts,
            password_reset_time_in_days=settings.password_reset_time_in_days,
            password_complexity=PasswordComplexity(
                minimum_length=settings.password_complexity_minimum_length,
                special_characters=settings.password_complexity_special_characters,
            ),
            idle_lockout_in_minutes=settings.idle_lockout_in_minutes,
            require_admin_creds_when_updating_robot_software=settings.require_admin_creds_when_updating_robot_software,
            require_admin_creds_when_sending_protocol_to_robot=settings.require_admin_creds_when_sending_protocol_to_robot,
            require_admin_creds_for_signoff_protocol=settings.require_admin_creds_for_signoff_protocol,
            require_signoff_for_protocol_log=settings.require_signoff_for_protocol_log,
            require_reason_for_interaction=settings.require_reason_for_interaction,
            min_length_of_reason_for_interaction=settings.min_length_of_reason_for_interaction,
            require_logs_to_be_saved_in_app=settings.require_logs_to_be_saved_in_app,
            delete_over_max_on_disk_protocols=settings.delete_over_max_on_disk_protocols,
        )


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the settings.

    All fields default to ``None``, meaning "leave unchanged".
    Only fields explicitly provided in the request body will be updated.
    """

    accessControlEnabled: Annotated[
        # Note: `Literal[True]` instead of `bool` to enforce one-way latching.
        Literal[True] | None,
        pydantic.Field(
            description=dedent(
                """
                Set to `true` to enable access control. Omit or set to `null` to leave it unchanged.

                **Warning:** Once enabled, access control cannot be disabled without assistance from Opentrons!
                """
            )
        ),
    ] = None
    max_number_of_login_attempts: Annotated[
        int | None,
        pydantic.Field(
            description="Max number of login attempts before account deactivation."
        ),
    ] = None
    password_reset_time_in_days: Annotated[
        int | None,
        pydantic.Field(
            description="Length of time in days until password must be changed."
        ),
    ] = None
    password_complexity: Annotated[
        PasswordComplexity | None,
        pydantic.Field(description="Password complexity level."),
    ] = None
    idle_lockout_in_minutes: Annotated[
        int | None,
        pydantic.Field(
            description="Length of time until account is locked due to inactivity."
        ),
    ] = None
    require_admin_creds_when_updating_robot_software: Annotated[
        bool | None,
        pydantic.Field(
            description="Require admin credentials when updating robot settings."
        ),
    ] = None
    require_admin_creds_when_sending_protocol_to_robot: Annotated[
        bool | None,
        pydantic.Field(
            description="Require admin credentials when sending protocol to robot."
        ),
    ] = None
    require_admin_creds_for_signoff_protocol: Annotated[
        bool | None,
        pydantic.Field(description="Require admin credentials for signoff protocol."),
    ] = None
    require_signoff_for_protocol_log: Annotated[
        bool | None,
        pydantic.Field(description="Require signoff for protocol log."),
    ] = None
    require_reason_for_interaction: Annotated[
        bool | None,
        pydantic.Field(description="Require reason for interaction."),
    ] = None
    min_length_of_reason_for_interaction: Annotated[
        int | None,
        pydantic.Field(description="Minimum length of reason for interaction."),
    ] = None
    require_logs_to_be_saved_in_app: Annotated[
        bool | None,
        pydantic.Field(
            description="Require logs to be saved in app. Path should be configured in the app."
        ),
    ] = None
    delete_over_max_on_disk_protocols: Annotated[
        bool | None,
        pydantic.Field(
            description="Automatically delete protocol run logs on the robot when there are 20 protocol run records."
        ),
    ] = None
