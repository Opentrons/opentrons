"""Tests for waitForTasks background-task recovery helpers."""

from datetime import datetime

from decoy import Decoy

from opentrons.protocol_engine.commands.background_task_recovery import (
    expand_wait_for_tasks_fixit,
)
from opentrons.protocol_engine.commands.command import CommandIntent, CommandStatus
from opentrons.protocol_engine.commands.vacuum_module.recovery import (
    VacuumModuleAssociatedCommandRecoveryResolver,
)
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureCreate,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import FinishedTask


def _start_pressure_command(
    timestamp: datetime,
    command_id: str = "start-command-id",
    task_id: str = "task-1",
) -> StartSetVacuumPressure:
    return StartSetVacuumPressure.model_construct(
        id=command_id,
        key=f"{command_id}-key",
        createdAt=timestamp,
        commandType="vacuumModule/startSetVacuumPressure",
        status=CommandStatus.SUCCEEDED,
        params=StartSetVacuumPressureParams(
            moduleId="vacuum-module-id",
            gaugePressure=-800.0,
            duration=30,
            timeout=10,
            ventAfter=True,
        ),
        result=StartSetVacuumPressureResult(taskId=task_id),
    )


def _vacuum_pressure_error(
    timestamp: datetime, error_id: str = "error"
) -> ErrorOccurrence:
    return ErrorOccurrence(
        id=error_id,
        createdAt=timestamp,
        errorType="VacuumModulePressureNotReachedError",
        errorCode="3040",
        detail="Vacuum Module Target Pressure Not Reached",
        errorInfo={"mode": "pressure", "target": -800.0, "current": -4.0},
    )


def _stub_failed_vacuum_task(
    decoy: Decoy,
    state_view: StateView,
    *,
    task_id: str,
    origin_id: str,
    command: StartSetVacuumPressure,
    timestamp: datetime,
) -> None:
    decoy.when(state_view.tasks.get_finished(task_id)).then_return(
        FinishedTask(
            id=task_id,
            createdAt=timestamp,
            finishedAt=timestamp,
            error=_vacuum_pressure_error(timestamp, f"{task_id}-error"),
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id(task_id)).then_return(
        origin_id
    )
    decoy.when(state_view.commands.get(origin_id)).then_return(command)
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )


def test_expand_wait_for_tasks_fixit_returns_none_when_no_failed_tasks(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
) -> None:
    """A wait with no failed tasks should be queued unchanged."""
    decoy.when(state_view.tasks.get_failed_tasks(["task-1"])).then_return([])

    result = expand_wait_for_tasks_fixit(
        ["task-1"],
        state_view,
        [VacuumModuleAssociatedCommandRecoveryResolver()],
        model_utils,
    )

    assert result is None


def test_expand_wait_for_tasks_fixit_returns_none_for_unrecoverable_failure(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
) -> None:
    """Unrecoverable waited failures should not dispatch a new start_*."""
    timestamp = datetime.now()
    decoy.when(state_view.tasks.get_failed_tasks(["task-1"])).then_return(["task-1"])
    decoy.when(state_view.tasks.get_finished("task-1")).then_return(
        FinishedTask(
            id="task-1",
            createdAt=timestamp,
            finishedAt=timestamp,
            error=ErrorOccurrence(
                id="error",
                createdAt=timestamp,
                errorType="TaskFailedError",
                detail="detail",
            ),
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id("task-1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        _start_pressure_command(timestamp)
    )

    result = expand_wait_for_tasks_fixit(
        ["task-1"],
        state_view,
        [VacuumModuleAssociatedCommandRecoveryResolver()],
        model_utils,
    )

    assert result is None


def test_expand_wait_for_tasks_fixit_builds_new_start_and_rewrites_failed_ids(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
) -> None:
    """Recoverable failures should become a new start_* plus rewritten wait ids."""
    timestamp = datetime.now()
    start_command = _start_pressure_command(timestamp)
    decoy.when(state_view.tasks.get_failed_tasks(["task-1", "ok-task"])).then_return(
        ["task-1"]
    )
    _stub_failed_vacuum_task(
        decoy,
        state_view,
        task_id="task-1",
        origin_id="start-command-id",
        command=start_command,
        timestamp=timestamp,
    )
    decoy.when(model_utils.generate_id()).then_return("new-task")
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)

    result = expand_wait_for_tasks_fixit(
        ["task-1", "ok-task"],
        state_view,
        [VacuumModuleAssociatedCommandRecoveryResolver()],
        model_utils,
    )

    assert result is not None
    creates, rewritten = result
    assert len(creates) == 1
    assert isinstance(creates[0], StartSetVacuumPressureCreate)
    assert creates[0].intent == CommandIntent.FIXIT
    assert creates[0].params.taskId == "new-task"
    assert creates[0].params.moduleId == "vacuum-module-id"
    assert creates[0].params.gaugePressure == -800.0
    assert rewritten == ["new-task", "ok-task"]


def test_expand_wait_for_tasks_fixit_dedupes_shared_origin(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
) -> None:
    """Two failed tasks from the same start_* should dispatch one new command."""
    timestamp = datetime.now()
    start_command = _start_pressure_command(timestamp)
    decoy.when(state_view.tasks.get_failed_tasks(["task-1", "task-2"])).then_return(
        ["task-1", "task-2"]
    )
    _stub_failed_vacuum_task(
        decoy,
        state_view,
        task_id="task-1",
        origin_id="start-command-id",
        command=start_command,
        timestamp=timestamp,
    )
    _stub_failed_vacuum_task(
        decoy,
        state_view,
        task_id="task-2",
        origin_id="start-command-id",
        command=start_command,
        timestamp=timestamp,
    )
    decoy.when(model_utils.generate_id()).then_return("new-task")
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)

    result = expand_wait_for_tasks_fixit(
        ["task-1", "task-2"],
        state_view,
        [VacuumModuleAssociatedCommandRecoveryResolver()],
        model_utils,
    )

    assert result is not None
    creates, rewritten = result
    assert len(creates) == 1
    assert rewritten == ["new-task", "new-task"]
