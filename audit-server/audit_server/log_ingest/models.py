import datetime

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


class AuditLogMessage(SubmitAuditLogMessageData):
    """An audit log message together with the time the audit server received it."""

    loggedAt: datetime.datetime


class SubmitAuditLogSuccessData(_StrictBaseModel):
    """The response to a successful audit log submission."""

    loggedAt: datetime.datetime
