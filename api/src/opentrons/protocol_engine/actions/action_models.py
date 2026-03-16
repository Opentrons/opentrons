"""Serializable Pydantic models for dispatched actions.

Each internal Action dataclass maps to a corresponding record model here.
Duplicative data is replaced by linking IDs; StateUpdate is included natively
since it is now a Pydantic BaseModel.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict

from ..state.update_types import StateUpdate


class _ActionRecordBase(BaseModel):
    """Fields common to every action record."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    created_at: Optional[datetime] = None


class PlayActionRecord(_ActionRecordBase):
    """Record of a play action."""

    action_type: Literal["play"] = "play"
    requested_at: datetime


class PauseActionRecord(_ActionRecordBase):
    """Record of a pause action."""

    action_type: Literal["pause"] = "pause"
    source: str


class StopActionRecord(_ActionRecordBase):
    """Record of a stop action."""

    action_type: Literal["stop"] = "stop"
    from_asynchronous_error: bool = False


class ResumeFromRecoveryActionRecord(_ActionRecordBase):
    """Record of resuming from error recovery."""

    action_type: Literal["resumeFromRecovery"] = "resumeFromRecovery"
    state_update: StateUpdate


class FinishActionRecord(_ActionRecordBase):
    """Record of a finish action."""

    action_type: Literal["finish"] = "finish"
    set_run_status: bool = True
    error_details: Optional[Dict[str, Any]] = None


class HardwareStoppedActionRecord(_ActionRecordBase):
    """Record of hardware stopped."""

    action_type: Literal["hardwareStopped"] = "hardwareStopped"
    completed_at: datetime
    finish_error_details: Optional[Dict[str, Any]] = None


class DoorChangeActionRecord(_ActionRecordBase):
    """Record of a door state change."""

    action_type: Literal["doorChange"] = "doorChange"
    door_state: str
    module_serial: Optional[str] = None


class QueueCommandActionRecord(_ActionRecordBase):
    """Record of a command being queued (command params are in the command list)."""

    action_type: Literal["queueCommand"] = "queueCommand"
    command_id: str
    request_hash: Optional[str] = None
    failed_command_id: Optional[str] = None


class RunCommandActionRecord(_ActionRecordBase):
    """Record of a command starting execution."""

    action_type: Literal["runCommand"] = "runCommand"
    command_id: str
    started_at: datetime


class SucceedCommandActionRecord(_ActionRecordBase):
    """Record of a command succeeding, with its state changes."""

    action_type: Literal["succeedCommand"] = "succeedCommand"
    command_id: str
    state_update: StateUpdate


class FailCommandActionRecord(_ActionRecordBase):
    """Record of a command failing, with error info and any state changes."""

    action_type: Literal["failCommand"] = "failCommand"
    command_id: str
    error_id: str
    failed_at: datetime
    error_recovery_type: str
    state_update: Optional[StateUpdate] = None


class StartTaskActionRecord(_ActionRecordBase):
    """Record of a background task starting."""

    action_type: Literal["startTask"] = "startTask"
    task_id: str


class FinishTaskActionRecord(_ActionRecordBase):
    """Record of a background task finishing."""

    action_type: Literal["finishTask"] = "finishTask"
    task_id: str
    finished_at: datetime
    has_error: bool = False


class AddLabwareOffsetActionRecord(_ActionRecordBase):
    """Record of a labware offset being added."""

    action_type: Literal["addLabwareOffset"] = "addLabwareOffset"
    labware_offset_id: str


class AddLabwareDefinitionActionRecord(_ActionRecordBase):
    """Record of a labware definition being added."""

    action_type: Literal["addLabwareDefinition"] = "addLabwareDefinition"
    definition_uri: str


class AddLiquidActionRecord(_ActionRecordBase):
    """Record of a liquid being added."""

    action_type: Literal["addLiquid"] = "addLiquid"
    liquid_id: str


class SetDeckConfigurationActionRecord(_ActionRecordBase):
    """Record of the deck configuration being set."""

    action_type: Literal["setDeckConfiguration"] = "setDeckConfiguration"


class AddAddressableAreaActionRecord(_ActionRecordBase):
    """Record of an addressable area being added."""

    action_type: Literal["addAddressableArea"] = "addAddressableArea"
    addressable_area_name: str


class AddModuleActionRecord(_ActionRecordBase):
    """Record of a module being added."""

    action_type: Literal["addModule"] = "addModule"
    module_id: str
    serial_number: str


class SetPipetteMovementSpeedActionRecord(_ActionRecordBase):
    """Record of pipette movement speed being set."""

    action_type: Literal["setPipetteMovementSpeed"] = "setPipetteMovementSpeed"
    pipette_id: str
    speed: Optional[float] = None


class CreateUserCommandAnnotationRecord(_ActionRecordBase):
    """Record of a user command annotation being created."""

    action_type: Literal["createUserCommandAnnotation"] = "createUserCommandAnnotation"
    annotation_id: str
    name: str
    description: Optional[str] = None
    params: Dict[str, Union[str, float, int]] = {}


class AddCameraSettingsActionRecord(_ActionRecordBase):
    """Record of camera settings being added."""

    action_type: Literal["addCameraSettings"] = "addCameraSettings"


class AddCameraCaptureImageSettingsActionRecord(_ActionRecordBase):
    """Record of camera capture image settings being added."""

    action_type: Literal["addCameraCaptureImageSettings"] = (
        "addCameraCaptureImageSettings"
    )


class SetErrorRecoveryPolicyActionRecord(_ActionRecordBase):
    """Record of the error recovery policy being set."""

    action_type: Literal["setErrorRecoveryPolicy"] = "setErrorRecoveryPolicy"


ActionRecord = Union[
    PlayActionRecord,
    PauseActionRecord,
    StopActionRecord,
    ResumeFromRecoveryActionRecord,
    FinishActionRecord,
    HardwareStoppedActionRecord,
    DoorChangeActionRecord,
    QueueCommandActionRecord,
    RunCommandActionRecord,
    SucceedCommandActionRecord,
    FailCommandActionRecord,
    StartTaskActionRecord,
    FinishTaskActionRecord,
    AddLabwareOffsetActionRecord,
    AddLabwareDefinitionActionRecord,
    AddLiquidActionRecord,
    SetDeckConfigurationActionRecord,
    AddAddressableAreaActionRecord,
    AddModuleActionRecord,
    SetPipetteMovementSpeedActionRecord,
    CreateUserCommandAnnotationRecord,
    AddCameraSettingsActionRecord,
    AddCameraCaptureImageSettingsActionRecord,
    SetErrorRecoveryPolicyActionRecord,
]
"""Discriminated union of all serializable action records."""
