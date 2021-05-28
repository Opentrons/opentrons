"""Request and response models for session input resources."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class SessionInputType(str, Enum):
    """Input model types."""

    START = "start"


class CreateSessionInputData(BaseModel):
    """Request model for new input creation."""

    inputType: SessionInputType


class SessionInput(ResourceModel):
    """Session input model.

    A SessionInput resource represents a client-provided input into the
    session in order to control the execution of the session itself.

    This is different than a protocol command, which represents an individual
    action to execute on the robot as part of a protocol.
    """

    id: str = Field(..., description="A unique identifier to reference this input.")
    createdAt: datetime = Field(..., description="When this input was created.")
    inputType: SessionInputType = Field(
        ...,
        description="Specific type of input, which determines how to handle the input.",
    )
