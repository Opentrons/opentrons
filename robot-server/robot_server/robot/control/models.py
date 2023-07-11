"""Request and response models for /robot/control endpoints."""

import enum
from pydantic import BaseModel, Field
from typing import List


class EstopState(enum.Enum):
    """Current status of the estop on this robot."""

    NOT_PRESENT = "notPresent"
    PHYSICALLY_ENGAGED = "physicallyEngaged"
    LOGICALLY_ENGAGED = "logicallyEngaged"
    DISENGAGED = "disengaged"


class EstopAttachLocation(enum.Enum):
    """Physical location where estop can be attached."""

    LEFT = "left"
    RIGHT = "right"


class EstopPhysicalStatus(enum.Enum):
    """Physical status of a specific estop."""

    ENGAGED = "engaged"
    DISENGAGED = "disengaged"
    NOT_PRESENT = "notPresent"


class EstopPhysicalStatusModel(BaseModel):
    """Physical status of a single estop."""

    mount: EstopAttachLocation = Field(
        ..., description="The mount that this status pertains to."
    )
    status: EstopPhysicalStatus = Field(
        ..., description="The physical status of this mount."
    )


class EstopStatusModel(BaseModel):
    """Model for the current estop status."""

    status: EstopState = Field(
        ..., description="The current status of the estop on this robot."
    )

    physical_status: List[EstopPhysicalStatusModel] = Field(
        ..., description="Status of each physical estop mount."
    )
