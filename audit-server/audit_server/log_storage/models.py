"""Request and response models for the audit log export endpoints."""

from datetime import datetime
from typing import Optional

import pydantic


class LogPeriodSummary(pydantic.BaseModel):
    """Summary of a single audit log period."""

    id: int = pydantic.Field(
        description=(
            "A monotonically increasing integer that uniquely identifies this log period. "
            "Use this value to reference the period in other API calls. "
            "Values are not guaranteed to be contiguous."
        )
    )
    startedAt: datetime
    endedAt: Optional[datetime] = pydantic.Field(
        description="The time this period ended, or null if the period is still active."
    )


class UserLogEntry(pydantic.BaseModel):
    """User Log Entry information to be exported."""

    message: str
    message_hash: str
    message_sig: str
    sig_version: str


class UserLogForExport(pydantic.BaseModel):
    """User log data for export."""

    userLogEntries: list[UserLogEntry]
    startedAt: datetime
    endedAt: Optional[datetime] = pydantic.Field(
        description="The time this period ended, or null if the period is still active."
    )
