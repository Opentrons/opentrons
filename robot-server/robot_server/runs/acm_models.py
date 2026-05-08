"""Models for access-control documentation attached to run actions."""

from datetime import datetime

from pydantic import BaseModel, Field


class DocumentationRequest(BaseModel):
    """Access-control documentation supplied."""

    note: str = Field(..., description="User-supplied justification note.")
    confirmedAt: datetime = Field(..., description="When the user confirmed.")
    username: str = Field(..., description="Username that confirmed.")
