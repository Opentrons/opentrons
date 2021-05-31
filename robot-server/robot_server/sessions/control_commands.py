"""Request and response models for session input resources."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class SessionControlType(str, Enum):
    """Control input types."""

    START = "start"


class SessionControlCommandCreateData(BaseModel):
    """Request model for new control input creation."""

    controlType: SessionControlType


class SessionControlCommand(ResourceModel):
    """Session input model.

    A SessionControlCommand resource represents a client-provided input to
    the session in order to control the execution of the session itself.

    This is different than a protocol command, which represents an individual
    action to execute on the robot as part of a protocol.
    """

    id: str = Field(..., description="A unique identifier to reference the command.")
    createdAt: datetime = Field(..., description="When the command was created.")
    controlType: SessionControlType = Field(
        ...,
        description="Specific type of control command, which determines how to act.",
    )
