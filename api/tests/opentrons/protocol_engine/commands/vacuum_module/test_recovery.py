"""Tests for vacuum module associated-command recovery resolver."""

from datetime import datetime

from decoy import Decoy

from opentrons_shared_data.errors.exceptions import VacuumModuleWasteFullError

from opentrons.protocol_engine.commands.command import CommandIntent, CommandStatus
from opentrons.protocol_engine.commands.vacuum_module.common import (
    VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
    VacuumModuleCarboyFullError,
)
from opentrons.protocol_engine.commands.vacuum_module.recovery import (
    VacuumModuleAssociatedCommandRecoveryResolver,
)
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureCreate,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from opentrons.protocol_engine.commands.wait_for_tasks import (
    WaitForTasks,
    WaitForTasksParams,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import LoadedModule, ModuleModel


def test_can_handle_recoverable_vacuum_errors() -> None:
    """It should recognize recoverable vacuum error codes."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    task_error = ErrorOccurrence(
        id="error",
        createdAt=datetime.now(),
        errorType="VacuumModuleWasteFullError",
        errorCode=VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
        detail="Vacuum Module Waste Container Full",
    )

    assert subject.can_handle_error(task_error) is True
    assert (
        subject.can_handle_error(
            VacuumModuleWasteFullError("VM123", "pressure", 0.0, 0.0)
        )
        is True
    )


def test_get_command_id_for_async_notification(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should return the last vacuum background command id."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    state_view = decoy.mock(cls=StateView)

    decoy.when(
        state_view.modules.get_has_module_probably_matching_hardware_details(
            ModuleModel.VACUUM_MODULE_V1, "VM123"
        )
    ).then_return(True)
    decoy.when(state_view.modules.get_all()).then_return(
        [
            LoadedModule.model_construct(
                id="vacuum-module-id",
                model=ModuleModel.VACUUM_MODULE_V1,
                serialNumber="VM123",
            )
        ]
    )
    decoy.when(
        state_view.tasks.get_last_background_command_id("vacuum-module-id")
    ).then_return("start-command-id")

    command_id = subject.get_command_id_for_async_notification(
        module_model=ModuleModel.VACUUM_MODULE_V1,
        module_serial="VM123",
        state_view=state_view,
    )

    assert command_id == "start-command-id"


def test_to_defined_error_data_maps_carboy_full(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map recoverable vacuum errors to defined command error data."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    state_view = decoy.mock(cls=StateView)
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    command = StartSetVacuumPressure.model_construct(
        id="start-command-id",
        key="start-command-key",
        createdAt=timestamp,
        commandType="vacuumModule/startSetVacuumPressure",
        status=CommandStatus.SUCCEEDED,
        params=StartSetVacuumPressureParams.model_construct(
            moduleId="vacuum-module-id",
            gaugePressure=-50.0,
            ventAfter=True,
        ),
        result=StartSetVacuumPressureResult(taskId="task-1"),
    )
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )

    result = subject.to_defined_error_data(
        error=VacuumModuleWasteFullError("VM123", "pressure", 0.0, 0.0),
        command=command,
        state_view=state_view,
        model_utils=model_utils,
    )

    assert result is not None
    assert isinstance(result.public, VacuumModuleCarboyFullError)
    assert result.public.errorType == "vacuumCarboyFull"


def _start_pressure_command(timestamp: datetime) -> StartSetVacuumPressure:
    return StartSetVacuumPressure.model_construct(
        id="start-command-id",
        key="start-command-key",
        createdAt=timestamp,
        commandType="vacuumModule/startSetVacuumPressure",
        status=CommandStatus.SUCCEEDED,
        params=StartSetVacuumPressureParams.model_construct(
            moduleId="vacuum-module-id",
            gaugePressure=-50.0,
            ventAfter=True,
            taskId="old-task",
        ),
        result=StartSetVacuumPressureResult(taskId="old-task"),
    )


def test_create_retry_builds_new_start_pressure_request() -> None:
    """It should copy start_* params onto a new fixit request with a new task id."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    command = _start_pressure_command(datetime.now())

    create = subject.create_retry(command, task_id="new-task")

    assert isinstance(create, StartSetVacuumPressureCreate)
    assert create.intent == CommandIntent.FIXIT
    assert create.params.moduleId == "vacuum-module-id"
    assert create.params.gaugePressure == -50.0
    assert create.params.taskId == "new-task"


def test_create_retry_returns_none_for_unassociated_command() -> None:
    """It should not build a retry request for non-vacuum start_* commands."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    command = WaitForTasks.model_construct(
        id="wait-id",
        key="wait-key",
        createdAt=datetime.now(),
        commandType="waitForTasks",
        status=CommandStatus.FAILED,
        params=WaitForTasksParams(task_ids=["task-1"]),
    )

    assert subject.create_retry(command, task_id="new-task") is None
