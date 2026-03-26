"""Request and response models for the `/settings` endpoints."""

from textwrap import dedent
from typing import Annotated, Any, ClassVar, Literal

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current settings.

    Field defaults define the system defaults for all settings.
    These are used to seed the database and to reset settings.
    Do not change them without coordinating.
    """

    # TODO(tz, 2026-03-24): https://opentrons.atlassian.net/browse/EXEC-2468
    accessControlEnabled: bool = pydantic.Field(
        default=False,
        description="When enabled, authorization is enforced throughout the robot's HTTP APIs. "
        "Protected endpoints are blocked unless the request carries an OAuth 2 access token "
        "with the appropriate scopes. See the `/auth/oauth2` endpoints. "
        "When disabled (the default), all endpoints allow unauthenticated access.",
    )
    maxNumberOfLoginAttempts: int | None = pydantic.Field(
        default=5,
        description="Max number of login attempts before account deactivation. Set to null to remove the limit.",
    )
    passwordResetTime: float | None = pydantic.Field(
        default=None,
        description="Duration in seconds until password must be changed. Set to null to remove the limit.",
    )
    passwordComplexityMinimumLength: int | None = pydantic.Field(
        default=None,
        description="Minimum length of password. Set to null to remove the limit.",
    )
    passwordComplexitySpecialCharacters: bool | None = pydantic.Field(
        default=None,
        description="Require special characters in password. Set to null to remove the requirement.",
    )
    idleLogout: float = pydantic.Field(
        default=180.0,
        description="Duration in seconds until account is logged out due to inactivity.",
    )
    requireReasonForInteraction: bool = pydantic.Field(
        default=True,
        description="Require reason for interaction.",
    )
    minLengthOfReasonForInteraction: int | None = pydantic.Field(
        default=None,
        description="Minimum length of reason for interaction. Set to null to remove the requirement.",
    )


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the settings.

    All fields default to ``null``, meaning "remove the requirement".
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
    maxNumberOfLoginAttempts: Annotated[
        int | None,
        pydantic.Field(
            description="Max number of login attempts before account deactivation."
        ),
    ] = None
    passwordResetTime: Annotated[
        float | None,
        pydantic.Field(description="Duration in seconds until password must be changed."),
    ] = None
    passwordComplexityMinimumLength: Annotated[
        int | None,
        pydantic.Field(description="Minimum length of password."),
    ] = None
    passwordComplexitySpecialCharacters: Annotated[
        bool | None,
        pydantic.Field(description="Require special characters in password."),
    ] = None
    idleLogout: Annotated[
        float | None,
        pydantic.Field(description="Duration in seconds until account is logged out due to inactivity."),
    ] = None
    requireAdminCredsWhenUpdatingRobotSoftware: Annotated[
        bool | None,
        pydantic.Field(
            description="Require admin credentials when updating robot settings."
        ),
    ] = None
    requireAdminCredsWhenSendingProtocolToRobot: Annotated[
        bool | None,
        pydantic.Field(
            description="Require admin credentials when sending protocol to robot."
        ),
    ] = None
    requireAdminCredsForSignoffProtocol: Annotated[
        bool | None,
        pydantic.Field(description="Require admin credentials for signoff protocol."),
    ] = None
    requireSignoffForProtocolLog: Annotated[
        bool | None,
        pydantic.Field(description="Require signoff for protocol log."),
    ] = None
    requireReasonForInteraction: Annotated[
        bool | None,
        pydantic.Field(description="Require reason for interaction."),
    ] = None
    minLengthOfReasonForInteraction: Annotated[
        int | None,
        pydantic.Field(description="Minimum length of reason for interaction."),
    ] = None
    requireLogsToBeSavedInApp: Annotated[
        bool | None,
        pydantic.Field(
            description="Require logs to be saved in app. Path should be configured in the app."
        ),
    ] = None
    deleteOverMaxOnDiskProtocols: Annotated[
        bool | None,
        pydantic.Field(
            description="Automatically delete protocol run logs on the robot when there are 20 protocol run records."
        ),
    ] = None

    _NON_NULLABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {
            "accessControlEnabled",
            "idleLogout",
            "requireAdminCredsWhenUpdatingRobotSoftware",
            "requireAdminCredsWhenSendingProtocolToRobot",
            "requireAdminCredsForSignoffProtocol",
            "requireSignoffForProtocolLog",
            "requireReasonForInteraction",
            "requireLogsToBeSavedInApp",
            "deleteOverMaxOnDiskProtocols",
        }
    )

    @pydantic.model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, data: Any) -> Any:
        """Reject explicit nulls for non-nullable fields."""
        if isinstance(data, dict):
            for field in cls._NON_NULLABLE_FIELDS:
                if field in data and data[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return data
