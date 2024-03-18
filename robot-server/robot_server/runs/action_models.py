"""Request and response models for controlling runs with actions."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class RunActionType(str, Enum):
    """The type of the run control action.

    * `"play"`: Start or resume a run.
    * `"pause"`: Pause a run.
    * `"stop"`: Stop (cancel) a run.
    * `"resume-from-recovery"`: Resume normal protocol execution after a command failed,
      the run was placed in `awaiting-recovery` mode, and manual recovery steps
      were taken.
    """

    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"
    RESUME_FROM_RECOVERY = "resume-from-recovery"


class RunActionCreate(BaseModel):
    """Request model for new control action creation."""

    actionType: RunActionType


class RunAction(ResourceModel):
    """Run control action model.

    A RunAction resource represents a client-provided command to
    the run in order to control the execution of the run itself.

    This is different than a protocol command, which represents an individual
    robotic procedure to execute as part of a protocol.
    """

    id: str = Field(..., description="A unique identifier to reference the command.")
    createdAt: datetime = Field(..., description="When the command was created.")
    actionType: RunActionType = Field(
        ...,
        description="Specific type of action, which determines behavior.",
    )
