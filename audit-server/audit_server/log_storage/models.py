"""Request and response models for the audit log export endpoints."""

from datetime import datetime
from typing import Optional

import pydantic


class LogPeriodSummary(pydantic.BaseModel):
    """Summary of a single audit log period."""

    id: str = pydantic.Field(
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


class LogPeriodDetails(pydantic.BaseModel):
    """Detailed information about a single audit log period."""

    id: str = pydantic.Field(
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
    recordCount: int = pydantic.Field(
        description="The number of user log records included in this period."
    )
    totalSizeBytes: int = pydantic.Field(
        description=(
            "Approximate total size in bytes of the period's user log messages "
            "and attached robot log files."
        )
    )
    attachedFilenames: list[str] = pydantic.Field(
        description="Filenames of robot log files attached to this period."
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
