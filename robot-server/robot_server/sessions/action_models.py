"""Request and response models for controlling sessions with actions."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class SessionActionType(str, Enum):
    """Types of session control actions."""

    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"


class SessionActionCreateData(BaseModel):
    """Request model for new control action creation."""

    actionType: SessionActionType


class SessionAction(ResourceModel):
    """Session control action model.

    A SessionAction resource represents a client-provided command to
    the session in order to control the execution of the session itself.

    This is different than a protocol command, which represents an individual
    robotic procedure to execute as part of a protocol.
    """

    id: str = Field(..., description="A unique identifier to reference the command.")
    createdAt: datetime = Field(..., description="When the command was created.")
    actionType: SessionActionType = Field(
        ...,
        description="Specific type of action, which determines behavior.",
    )
