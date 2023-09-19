"""Request and response models for /robot/control endpoints."""

import enum
from pydantic import BaseModel, Field
from opentrons.hardware_control.types import (
    EstopPhysicalStatus as HwEstopPhysicalStatus,
    EstopState as HwEstopState,
    DoorState as HwDoorState,
)


class EstopState(enum.Enum):
    """Current status of the estop on this robot."""

    NOT_PRESENT = "notPresent"
    PHYSICALLY_ENGAGED = "physicallyEngaged"
    LOGICALLY_ENGAGED = "logicallyEngaged"
    DISENGAGED = "disengaged"

    @classmethod
    def from_hw_state(cls, hw_state: HwEstopState) -> "EstopState":
        """Build from the hardware equivalent."""
        return _HW_STATE_TO_STATE[hw_state]


_HW_STATE_TO_STATE = {
    HwEstopState.NOT_PRESENT: EstopState.NOT_PRESENT,
    HwEstopState.PHYSICALLY_ENGAGED: EstopState.PHYSICALLY_ENGAGED,
    HwEstopState.LOGICALLY_ENGAGED: EstopState.LOGICALLY_ENGAGED,
    HwEstopState.DISENGAGED: EstopState.DISENGAGED,
}


class EstopPhysicalStatus(enum.Enum):
    """Physical status of a specific estop."""

    ENGAGED = "engaged"
    DISENGAGED = "disengaged"
    NOT_PRESENT = "notPresent"

    @classmethod
    def from_hw_physical_status(
        cls, hw_physical_status: HwEstopPhysicalStatus
    ) -> "EstopPhysicalStatus":
        """Build from the hardware equivalent."""
        return _HW_PHYSICAL_STATUS_TO_PHYSICAL_STATUS[hw_physical_status]


_HW_PHYSICAL_STATUS_TO_PHYSICAL_STATUS = {
    HwEstopPhysicalStatus.NOT_PRESENT: EstopPhysicalStatus.NOT_PRESENT,
    HwEstopPhysicalStatus.ENGAGED: EstopPhysicalStatus.ENGAGED,
    HwEstopPhysicalStatus.DISENGAGED: EstopPhysicalStatus.DISENGAGED,
}


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


class DoorState(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"

    @classmethod
    def from_hw_physical_status(cls, hw_state: HwDoorState) -> "DoorState":
        if hw_state == HwDoorState.OPEN:
            return cls.OPEN
        else:
            return cls.CLOSED


class DoorStatusModel(BaseModel):
    """Model for the current door status."""

    status: DoorState = Field(..., description="Whether the door is open or closed.")
    doorRequiredClosedForProtocol: bool = Field(
        ..., description="Whether the door must be closed to run a protcol."
    )
