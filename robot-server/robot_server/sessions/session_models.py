"""Request models for the /sessions API."""

from pydantic import BaseModel, Field
from typing import List

from robot_server.service.json_api import ResponseDataModel
from .session_type import SessionType


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
    commands: List[str] = Field(..., description="List of associated command IDs")
