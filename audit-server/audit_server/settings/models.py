"""Request and response models for the audit-server settings endpoints."""

from textwrap import dedent
from typing import Annotated

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current generic settings.

    There are currently no generic settings. New settings should be added here
    as fields with a default value; the default defines the system default and
    is used both to seed and to reset the setting.
    """


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the generic settings.

    There are currently no generic settings. New settings should be added here
    as optional fields defaulting to ``None``; only fields explicitly provided
    in the request body are updated.
    """


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
