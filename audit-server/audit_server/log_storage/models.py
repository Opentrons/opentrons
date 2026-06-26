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


class RobotLogPaths(pydantic.BaseModel):
    """Robot Log Entry information to be exported."""

    file_path: str
    file_hash: str
    file_sig: str
    file_sig_version: str


class LogPeriodEntries(pydantic.BaseModel):
    """Entries associated with a particular log period."""

    user_log_entries: list[UserLogEntry]
    robot_log_entries: list[RobotLogPaths]
