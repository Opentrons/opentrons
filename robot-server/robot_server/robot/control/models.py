"""Request and response models for /robot/control endpoints."""

import enum
from pydantic import BaseModel, Field


class EstopState(enum.Enum):
    """Current status of the estop on this robot."""

    NOT_PRESENT = "notPresent"
    PHYSICALLY_ENGAGED = "physicallyEngaged"
    LOGICALLY_ENGAGED = "logicallyEngaged"
    DISENGAGED = "disengaged"


class EstopPhysicalStatus(enum.Enum):
    """Physical status of a specific estop."""

    ENGAGED = "engaged"
    DISENGAGED = "disengaged"
    NOT_PRESENT = "notPresent"


class EstopStatusModel(BaseModel):
    """Model for the current estop status."""

    status: EstopState = Field(
        ..., description="The current status of the estop on this robot."
    )

    leftEstopPhysicalStatus: EstopPhysicalStatus = Field(
        ..., description="Physical status of the left estop mount."
    )

    rightEstopPhysicalStatus: EstopPhysicalStatus = Field(
        ..., description="Physical status of the right estop mount."
    )
