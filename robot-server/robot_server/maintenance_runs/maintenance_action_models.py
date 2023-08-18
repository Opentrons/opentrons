"""Request and response models for controlling maintenance runs with actions."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class MaintenanceRunActionType(str, Enum):
    """Types of run control actions.

    Args:
    PLAY: Start or resume a protocol run.
    PAUSE: Pause a run.
    STOP: Stop (cancel) a run.
    """

    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"


class MaintenanceRunActionCreate(BaseModel):
    """Request model for new control action creation."""

    actionType: MaintenanceRunActionType


class MaintenanceRunAction(ResourceModel):
    """Maintenance Run control action model.

    A MaintenanceRunAction resource represents a client-provided command to
    the run in order to control the execution of the run itself.

    This is different than a run command, which represents an individual
    robotic procedure to be executed.
    """

    id: str = Field(..., description="A unique identifier to reference the command.")
    createdAt: datetime = Field(..., description="When the command was created.")
    actionType: MaintenanceRunActionType = Field(
        ...,
        description="Specific type of action, which determines behavior.",
    )
