"""Request and response models for the audit-server settings endpoints."""

from textwrap import dedent
from typing import Annotated, ClassVar

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current generic settings.

    There are currently no generic settings. New settings should be added here
    as fields with a default value; the default defines the system default and
    is used both to seed and to reset the setting.
    """

    requireReasonForInteraction: bool = pydantic.Field(
        default=True,
        description="Require reason for interaction.",
    )
    minLengthOfReasonForInteraction: int | None = pydantic.Field(
        default=None,
        description="Minimum length of reason for interaction. Set to null to remove the requirement.",
    )


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the generic settings.

    There are currently no generic settings. New settings should be added here
    as optional fields defaulting to ``None``; only fields explicitly provided
    in the request body are updated.
    """

    requireReasonForInteraction: Annotated[
        bool | None,
        pydantic.Field(description="Require reason for interaction."),
    ] = None
    minLengthOfReasonForInteraction: Annotated[
        int | None,
        pydantic.Field(description="Minimum length of reason for interaction."),
    ] = None
    _NON_NULLABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {
            "requireReasonForInteraction",
        }
    )


class LoggingEnabledResponseData(pydantic.BaseModel):
    """A response with the current logging-enabled setting."""

    loggingEnabled: Annotated[
        bool,
        pydantic.Field(
            description=dedent("""\
                When enabled, the audit server records audit log messages it
                receives. When disabled (the default), audit logging is off.
                """)
        ),
    ]


class PatchLoggingEnabledRequestData(_StrictBaseModel):
    """A request to change the logging-enabled setting."""

    loggingEnabled: bool
    accountName: str
    legalName: str
    reason: str | None
