"""Request and response models for /robot/control endpoints."""

import enum
from pydantic import BaseModel, Field
from typing import List


class EstopState(enum.Enum):
    """Current status of the estop on this robot."""

    not_present = "not_present"
    physically_engaged = "physically_engaged"
    logically_engaged = "logically_engaged"
    disengaged = "disengaged"


class EstopAttachLocation(enum.Enum):
    """Physical location where estop can be attached."""

    left = "left"
    right = "right"


class EstopPhysicalStatus(enum.Enum):
    """Physical status of a specific estop."""

    engaged = "engaged"
    disengaged = "disengaged"
    not_present = "not_present"


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
