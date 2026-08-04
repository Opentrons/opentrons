import datetime
from typing import Annotated

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    pass


class SubmitAuditLogMessageData(_StrictBaseModel):
    """Message body for submitting an audit log message."""

    action: str
    accountName: str
    legalName: str
    message: str
    reason: str | None


class SubmitExternalAuditLogMessageData(_StrictBaseModel):
    """Message body for submitting an external audit log message."""

    action: Annotated[
        str,
        pydantic.Field(
            description="A short name for the action being logged. e.g. 'change update channel' or 'confirm labware placement'. The system will prepend this with 'External-'."
        ),
    ]
    message: Annotated[
        str,
        pydantic.Field(
            description="A longer message describing the specific action being logged."
        ),
    ]


class AuditLogMessage(SubmitAuditLogMessageData):
    """An audit log message together with the time the audit server received it."""

    loggedAt: datetime.datetime


class SubmitAuditLogSuccessData(_StrictBaseModel):
    """The response to a successful audit log submission."""

    loggedAt: datetime.datetime


class StoreRobotLogResponseData(_StrictBaseModel):
    """The response to storing a robot log."""

    loggingEnabled: bool
