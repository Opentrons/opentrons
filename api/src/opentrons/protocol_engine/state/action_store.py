"""Store that records every dispatched action as a serializable record."""

from __future__ import annotations

from typing import List

from ..actions.action_handler import ActionHandler
from ..actions.action_models import (
    ActionRecord,
    AddAddressableAreaActionRecord,
    AddCameraCaptureImageSettingsActionRecord,
    AddCameraSettingsActionRecord,
    AddLabwareDefinitionActionRecord,
    AddLabwareOffsetActionRecord,
    AddLiquidActionRecord,
    AddModuleActionRecord,
    CreateUserCommandAnnotationRecord,
    DoorChangeActionRecord,
    FailCommandActionRecord,
    FinishActionRecord,
    FinishTaskActionRecord,
    HardwareStoppedActionRecord,
    PauseActionRecord,
    PlayActionRecord,
    QueueCommandActionRecord,
    ResumeFromRecoveryActionRecord,
    RunCommandActionRecord,
    SetDeckConfigurationActionRecord,
    SetErrorRecoveryPolicyActionRecord,
    SetPipetteMovementSpeedActionRecord,
    StartTaskActionRecord,
    StopActionRecord,
    SucceedCommandActionRecord,
)
from ..actions.actions import (
    Action,
    AddAddressableAreaAction,
    AddCameraCaptureImageSettingsAction,
    AddCameraSettingsAction,
    AddLabwareDefinitionAction,
    AddLabwareOffsetAction,
    AddLiquidAction,
    AddModuleAction,
    CreateUserCommandAnnotation,
    DoorChangeAction,
    FailCommandAction,
    FinishAction,
    FinishTaskAction,
    HardwareStoppedAction,
    PauseAction,
    PlayAction,
    QueueCommandAction,
    ResumeFromRecoveryAction,
    RunCommandAction,
    SetDeckConfigurationAction,
    SetErrorRecoveryPolicyAction,
    SetPipetteMovementSpeedAction,
    StartTaskAction,
    StopAction,
    SucceedCommandAction,
)
from ..actions.get_state_update import get_state_updates
from ..state.update_types import StateUpdate


class ActionStore(ActionHandler):
    """Records all dispatched actions as serializable Pydantic records."""

    def __init__(self) -> None:
        self._records: List[ActionRecord] = []

    def handle_action(self, action: Action) -> None:  # noqa: C901
        """Convert the action to a record and store it if it is a known action type."""
        record = _action_to_record(action)
        if record is not None:
            self._records.append(record)

    def get_all(self) -> List[ActionRecord]:
        """Return all recorded actions in dispatch order."""
        return list(self._records)


def _action_to_record(action: Action) -> ActionRecord | None:  # noqa: C901
    """Convert an internal Action to a serializable ActionRecord."""
    if isinstance(action, PlayAction):
        return PlayActionRecord(requested_at=action.requested_at)
    if isinstance(action, PauseAction):
        return PauseActionRecord(source=action.source.value)
    if isinstance(action, StopAction):
        return StopActionRecord(from_asynchronous_error=action.from_asynchronous_error)
    if isinstance(action, ResumeFromRecoveryAction):
        return ResumeFromRecoveryActionRecord(state_update=action.state_update)
    if isinstance(action, FinishAction):
        error_details = None
        if action.error_details is not None:
            error_details = {
                "error_id": action.error_details.error_id,
                "created_at": action.error_details.created_at.isoformat(),
                "error": str(action.error_details.error),
            }
        return FinishActionRecord(
            set_run_status=action.set_run_status, error_details=error_details
        )
    if isinstance(action, HardwareStoppedAction):
        error_details = None
        if action.finish_error_details is not None:
            error_details = {
                "error_id": action.finish_error_details.error_id,
                "created_at": action.finish_error_details.created_at.isoformat(),
                "error": str(action.finish_error_details.error),
            }
        return HardwareStoppedActionRecord(
            completed_at=action.completed_at, finish_error_details=error_details
        )
    if isinstance(action, DoorChangeAction):
        return DoorChangeActionRecord(
            door_state=str(action.door_state),
            module_serial=action.module_serial,
        )
    if isinstance(action, QueueCommandAction):
        return QueueCommandActionRecord(
            command_id=action.command_id,
            created_at=action.created_at,
            request_hash=action.request_hash,
            failed_command_id=action.failed_command_id,
        )
    if isinstance(action, RunCommandAction):
        return RunCommandActionRecord(
            command_id=action.command_id, started_at=action.started_at
        )
    if isinstance(action, SucceedCommandAction):
        return SucceedCommandActionRecord(
            command_id=action.command.id, state_update=action.state_update
        )
    if isinstance(action, FailCommandAction):
        state_updates = get_state_updates(action)
        merged = StateUpdate.reduce(*state_updates) if state_updates else None
        return FailCommandActionRecord(
            command_id=action.command_id,
            error_id=action.error_id,
            failed_at=action.failed_at,
            error_recovery_type=action.type.name,
            state_update=merged,
        )
    if isinstance(action, StartTaskAction):
        return StartTaskActionRecord(task_id=action.task.id)
    if isinstance(action, FinishTaskAction):
        return FinishTaskActionRecord(
            task_id=action.task_id,
            finished_at=action.finished_at,
            has_error=action.error is not None,
        )
    if isinstance(action, AddLabwareOffsetAction):
        return AddLabwareOffsetActionRecord(
            labware_offset_id=action.labware_offset_id,
            created_at=action.created_at,
        )
    if isinstance(action, AddLabwareDefinitionAction):
        return AddLabwareDefinitionActionRecord(
            definition_uri=action.definition.otId
            if hasattr(action.definition, "otId")
            else str(action.definition.namespace)
            + "/"
            + str(action.definition.parameters.loadName)
            + "/"
            + str(action.definition.version),
        )
    if isinstance(action, AddCameraSettingsAction):
        return AddCameraSettingsActionRecord()
    if isinstance(action, AddCameraCaptureImageSettingsAction):
        return AddCameraCaptureImageSettingsActionRecord()
    if isinstance(action, AddLiquidAction):
        return AddLiquidActionRecord(liquid_id=action.liquid.id)
    if isinstance(action, SetDeckConfigurationAction):
        return SetDeckConfigurationActionRecord()
    if isinstance(action, AddAddressableAreaAction):
        return AddAddressableAreaActionRecord(
            addressable_area_name=action.addressable_area_name
        )
    if isinstance(action, AddModuleAction):
        return AddModuleActionRecord(
            module_id=action.module_id, serial_number=action.serial_number
        )
    if isinstance(action, SetPipetteMovementSpeedAction):
        return SetPipetteMovementSpeedActionRecord(
            pipette_id=action.pipette_id, speed=action.speed
        )
    if isinstance(action, SetErrorRecoveryPolicyAction):
        return SetErrorRecoveryPolicyActionRecord()
    if isinstance(action, CreateUserCommandAnnotation):
        return CreateUserCommandAnnotationRecord(
            annotation_id=action.annotation_id,
            name=action.name,
            description=action.description,
            params=action.params,
        )
    return None
