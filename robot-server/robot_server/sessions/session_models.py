"""Request and response models for session resources."""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResponseDataModel


class SessionType(str, Enum):
    """All available session types."""

    BASIC = "basic"


class CreateSessionData(BaseModel):
    """Request data sent when creating a session."""

    sessionType: SessionType = Field(
        SessionType.BASIC,
        description="The session type to create.",
    )


class Session(ResponseDataModel):
    """Basic session resource model."""

    id: str = Field(..., description="Unique session identifier.")
    sessionType: SessionType = Field(
        SessionType.BASIC,
        description="Specific session type.",
    )
    createdAt: datetime = Field(..., description="When the session was created")
