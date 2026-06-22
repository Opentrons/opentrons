"""Request and response models for the audit log export endpoints."""

from datetime import datetime
from typing import Optional

import pydantic


class LogPeriodSummary(pydantic.BaseModel):
    """Summary of a single audit log period."""

    id: str
    startedAt: datetime
    endedAt: Optional[datetime]
