"""Request and response models for the `/settings` endpoints."""

from textwrap import dedent
from typing import Annotated, Literal

import pydantic


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

    accessControlEnabled: Annotated[
        bool,
        pydantic.Field(
            description=dedent(
                """\
                When enabled, authorization is enforced throughout the robot's HTTP APIs.
                Protected endpoints are blocked unless the request carries an
                OAuth 2 access token with the appropriate scopes. See the `/auth/oauth2`
                endpoints.

                When disabled (the default), all endpoints allow unauthenticated access.
                """
            )
        ),
    ] = None
    max_number_of_login_attempts: Annotated[
        int,
        pydantic.Field(
            description="Max number of login attempts before account deactivation."
        ),
    ] = 5
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
        int,
        pydantic.Field(
            description="Length of time until account is locked due to inactivity."
        ),
    ] = 3
    require_admin_creds_when_updating_robot_software: Annotated[
        bool,
        pydantic.Field(
            description="Require admin credentials when updating robot settings."
        ),
    ] = True
    require_admin_creds_when_sending_protocol_to_robot: Annotated[
        bool,
        pydantic.Field(
            description="Require admin credentials when sending protocol to robot."
        ),
    ] = True
    require_admin_creds_for_signoff_protocol: Annotated[
        bool,
        pydantic.Field(description="Require admin credentials for signoff protocol."),
    ] = False
    require_signoff_for_protocol_log: Annotated[
        bool,
        pydantic.Field(description="Require signoff for protocol log."),
    ] = True
    require_reason_for_interaction: Annotated[
        bool,
        pydantic.Field(description="Require reason for interaction."),
    ] = True
    min_length_of_reason_for_interaction: Annotated[
        int | None,
        pydantic.Field(description="Minimum length of reason for interaction."),
    ] = None
    require_logs_to_be_saved_in_app: Annotated[
        bool,
        pydantic.Field(
            description="Require logs to be saved in app. Path should be configured in the app."
        ),
    ] = True
    delete_over_max_on_disk_protocols: Annotated[
        bool,
        pydantic.Field(
            description="Automatically delete protocol run logs on the robot when there are 20 protocol run records."
        ),
    ] = True


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
