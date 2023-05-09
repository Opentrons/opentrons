"""Request and response models for /subsystems endpoints."""

import enum
from typing_extensions import Literal
from typing import Optional, TypeVar, Union, Generic, cast, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control.types import (
    SubSystem as HWSubSystem,
    UpdateState as HWUpdateState,
)


class SubSystem(enum.Enum):
    """Specific hardware elements of the robot system.

    Only certain subsystems might be valid for a certain robot, and not all subsystems
    might be attached at any given time. In general, specific subsystems should only
    be provided if general queries indicate that they are present.
    """

    gantry_x = "gantry_x"
    gantry_y = "gantry_y"
    head = "head"
    pipette_left = "pipette_left"
    pipette_right = "pipette_right"
    gripper = "gripper"
    rear_panel = "rear_panel"
    motor_controller_board = "motor_controller_board"

    @classmethod
    def from_hw(cls, hw_subsystem: HWSubSystem) -> "SubSystem":
        return _HW_SUBSYSTEM_TO_SUBSYSTEM[hw_subsystem]

    def to_hw(self) -> HWSubSystem:
        return _SUBSYSTEM_TO_HW_SUBSYSTEM[self]


_HW_SUBSYSTEM_TO_SUBSYSTEM: Dict[HWSubSystem, SubSystem] = {
    HWSubSystem.gantry_x: SubSystem.gantry_x,
    HWSubSystem.gantry_y: SubSystem.gantry_y,
    HWSubSystem.head: SubSystem.head,
    HWSubSystem.pipette_left: SubSystem.pipette_left,
    HWSubSystem.pipette_right: SubSystem.pipette_right,
    HWSubSystem.rear_panel: SubSystem.rear_panel,
    HWSubSystem.motor_controller_board: SubSystem.motor_controller_board,
}

_SUBSYSTEM_TO_HW_SUBSYSTEM: Dict[SubSystem, HWSubSystem] = {
    SubSystem.gantry_x: HWSubSystem.gantry_x,
    SubSystem.gantry_y: HWSubSystem.gantry_y,
    SubSystem.head: HWSubSystem.head,
    SubSystem.pipette_left: HWSubSystem.pipette_left,
    SubSystem.pipette_right: HWSubSystem.pipette_right,
    SubSystem.rear_panel: HWSubSystem.rear_panel,
    SubSystem.motor_controller_board: HWSubSystem.motor_controller_board,
}


class UpdateState(enum.Enum):
    """The high-level state of an ongoing update."""

    queued = "queued"
    updating = "updating"
    done = "done"

    @classmethod
    def from_hw(cls, hw_update_state: HWUpdateState) -> "UpdateState":
        return _HW_UPDATE_STATE_TO_UPDATE_STATE[hw_update_state]

    def to_hw(self) -> HWUpdateState:
        return _UPDATE_STATE_TO_HW_UPDATE_STATE[self]


_UPDATE_STATE_TO_HW_UPDATE_STATE: Dict[UpdateState, HWUpdateState] = {
    UpdateState.queued: HWUpdateState.queued,
    UpdateState.updating: HWUpdateState.updating,
    UpdateState.done: HWUpdateState.done,
}

_HW_UPDATE_STATE_TO_UPDATE_STATE: Dict[HWUpdateState, UpdateState] = {
    HWUpdateState.queued: UpdateState.queued,
    HWUpdateState.updating: UpdateState.updating,
    HWUpdateState.done: UpdateState.done,
}


class PresentSubsystem(BaseModel):
    """Model for the status of a subsystem."""

    name: str = Field(..., description="The name of a connected subsystem.")
    ok: bool = Field(
        ...,
        description="Whether the subsystem is running, up to date, and in a normal state.",
    )
    current_fw_version: str = Field(
        ..., description="The current version of firmware the subsystem is running."
    )
    next_fw_version: str = Field(
        ...,
        description="What firmware version a prospective update would leave the subsystem running.",
    )
    fw_update_needed: bool = Field(
        ..., description="True if a client should begin an update for this subsystem."
    )
    revision: str = Field(
        ..., description="A descriptor of the hardware revision of the subsystem."
    )


class UpdateProgressData(BaseModel):
    """Model for status of firmware update progress."""

    id: str = Field(..., description="Unique ID for the update process.")
    createdAt: datetime = Field(..., description="When the update was posted.")
    subsystem: str = Field(..., description="The subsystem that is being updated.")
    updateStatus: UpdateState = Field(
        ..., description="Whether an update is queued, in progress or completed. "
    )
    updateProgress: int = Field(
        ..., description="Progress of the update depicted as an integer from 0 to 100."
    )


class UpdateProgressSummary(BaseModel):
    """Model for a quick summary of an update's progress."""

    id: str = Field(..., description="Unique ID for the update process.")
    createdAt: str = Field(..., description="When the update was posted.")
    subsystem: str = Field(..., descripiton="The subsystem that is being updated.")
    updateStatus: UpdateState = Field(
        ..., description="Whether an update is queued, in progress or completed"
    )
