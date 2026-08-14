"""Tests for vacuum module associated-command recovery resolver."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from decoy import Decoy

from opentrons_shared_data.errors.exceptions import VacuumModuleWasteFullError

from opentrons.protocol_engine.commands.command import CommandStatus, SuccessData
from opentrons.protocol_engine.commands.vacuum_module.common import (
    VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
    VacuumModuleCarboyFullError,
)
from opentrons.protocol_engine.commands.vacuum_module.recovery import (
    VacuumModuleAssociatedCommandRecoveryResolver,
)
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from opentrons.protocol_engine.commands.wait_for_tasks import (
    WaitForTasks,
    WaitForTasksParams,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    TaskHandler,
)
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


async def test_restart_runs_start_pressure_impl(decoy: Decoy) -> None:
    """It should re-run the public start pressure impl and clear taskId."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    command = _start_pressure_command(datetime.now())
    impl = MagicMock()
    impl.execute = AsyncMock(
        return_value=SuccessData(public=StartSetVacuumPressureResult(taskId="new-task"))
    )

    with patch(
        "opentrons.protocol_engine.commands.vacuum_module.recovery.StartSetVacuumPressureImpl",
        return_value=impl,
    ):
        task_id = await subject.restart(
            command,
            state_view=decoy.mock(cls=StateView),
            task_handler=decoy.mock(cls=TaskHandler),
            equipment=decoy.mock(cls=EquipmentHandler),
            movement=decoy.mock(cls=MovementHandler),
            model_utils=ModelUtils(),
        )

    assert task_id == "new-task"
    executed_params = impl.execute.await_args.args[0]
    assert executed_params.taskId is None


async def test_restart_returns_none_for_unassociated_command(decoy: Decoy) -> None:
    """It should not restart commands that are not vacuum start_* commands."""
    subject = VacuumModuleAssociatedCommandRecoveryResolver()
    command = WaitForTasks.model_construct(
        id="wait-id",
        key="wait-key",
        createdAt=datetime.now(),
        commandType="waitForTasks",
        status=CommandStatus.FAILED,
        params=WaitForTasksParams(task_ids=["task-1"]),
    )

    task_id = await subject.restart(
        command,
        state_view=decoy.mock(cls=StateView),
        task_handler=decoy.mock(cls=TaskHandler),
        equipment=decoy.mock(cls=EquipmentHandler),
        movement=decoy.mock(cls=MovementHandler),
        model_utils=ModelUtils(),
    )

    assert task_id is None
