"""Test wait for tasks."""

from datetime import datetime
from types import SimpleNamespace
from typing import cast

import pytest
from decoy import Decoy, matchers
from pydantic import BaseModel

from opentrons.hardware_control.modules.types import VacuumOperationMode
from opentrons.protocol_engine.actions import ActionDispatcher
from opentrons.protocol_engine.commands.command import (
    CommandIntent,
    CommandStatus,
    DefinedErrorData,
    SuccessData,
)
from opentrons.protocol_engine.commands.command_unions import Command
from opentrons.protocol_engine.commands.vacuum_module.common import (
    VacuumPressureNotReachedError,
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
    WaitForTasksImplementation,
    WaitForTasksParams,
    WaitForTasksResult,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.errors.exceptions import TaskFailedError
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    RunControlHandler,
)
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import FinishedTask, Task


async def test_wait_for_tasks_implementation_no_error(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    state_view: StateView,
) -> None:
    """It should wait for a list of tasks to complete using the RunControlHandler.

    No tasks have errors so NO exception should be raised.
    """
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)

    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return([])
    result = await subject.execute(data)
    for task in task_ids:
        fake_task = decoy.mock(cls=Task)
        decoy.when(state_view.tasks.get(task)).then_return(fake_task)

    decoy.verify(await run_control.wait_for_tasks(task_ids))
    assert result == SuccessData(public=WaitForTasksResult(task_ids=task_ids))


async def test_wait_for_tasks_implementation_with_error(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    state_view: StateView,
) -> None:
    """It should wait for a list of tasks to complete using the RunControlHandler.

    One task fails with a TaskFailedError so an exception SHOULD be raised.
    """
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()
    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return([task_ids[0]])
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(False)
    decoy.when(state_view.tasks.get_finished(task_ids[0])).then_return(
        FinishedTask(
            id=task_ids[0],
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=ErrorOccurrence(
                id="error",
                createdAt=created_timestamp,
                errorType="TaskFailedError",
                detail="detail",
            ),
        )
    )

    with pytest.raises(TaskFailedError) as exc_info:
        await subject.execute(data)

    err = exc_info.value
    assert isinstance(err, TaskFailedError)
    assert err.message == "1 tasks failed."

    for task in task_ids:
        fake_task = decoy.mock(cls=Task)
        decoy.when(state_view.tasks.get(task)).then_return(fake_task)
    decoy.verify(await run_control.wait_for_tasks(task_ids))


async def test_wait_for_tasks_succeeds_when_recovery_active_with_no_failed_tasks(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """It should succeed when recovery was entered via a late async notification."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
    )
    task_ids = ["task1"]
    data = WaitForTasksParams(task_ids=task_ids)

    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return([])
    fake_task = decoy.mock(cls=Task)
    decoy.when(state_view.tasks.get(task_ids[0])).then_return(fake_task)

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForTasksResult(task_ids=task_ids))
    decoy.verify(await run_control.wait_for_tasks(task_ids))


async def test_wait_for_tasks_succeeds_when_recoverable_failure_absorbed(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """It should succeed when every failed task is covered by active recovery."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
    )
    task_ids = ["task1"]
    data = WaitForTasksParams(task_ids=task_ids)

    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return(task_ids)
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(True)
    fake_task = decoy.mock(cls=Task)
    decoy.when(state_view.tasks.get(task_ids[0])).then_return(fake_task)

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForTasksResult(task_ids=task_ids))
    decoy.verify(await run_control.wait_for_tasks(task_ids))


async def test_wait_for_tasks_raises_when_recovery_active_but_uncovered_failure(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """It should fail when recovery is active but a waited-on task failed uncovered."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()

    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return(task_ids)
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(False)
    for task_id in task_ids:
        decoy.when(state_view.tasks.get_finished(task_id)).then_return(
            FinishedTask(
                id=task_id,
                createdAt=matchers.Anything(),
                finishedAt=matchers.Anything(),
                error=ErrorOccurrence(
                    id=f"{task_id}-error",
                    createdAt=created_timestamp,
                    errorType="TaskFailedError",
                    detail="detail",
                ),
            )
        )
        fake_task = decoy.mock(cls=Task)
        decoy.when(state_view.tasks.get(task_id)).then_return(fake_task)

    with pytest.raises(TaskFailedError) as exc_info:
        await subject.execute(data)

    assert exc_info.value.message == "2 tasks failed."
    decoy.verify(await run_control.wait_for_tasks(task_ids))


def _start_pressure_command(
    timestamp: datetime,
    command_id: str = "start-command-id",
    task_id: str = "task1",
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


def _unrecoverable_task_error(
    timestamp: datetime, error_id: str = "error"
) -> ErrorOccurrence:
    return ErrorOccurrence(
        id=error_id,
        createdAt=timestamp,
        errorType="TaskFailedError",
        detail="detail",
    )


async def test_wait_for_tasks_returns_defined_error_via_resolver(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """Resolver-handled task failures should become defined waitForTasks errors."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        model_utils=ModelUtils(),
        resolvers=[VacuumModuleAssociatedCommandRecoveryResolver()],
    )
    task_ids = ["task1"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()
    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return(task_ids)
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(False)
    decoy.when(state_view.tasks.get(task_ids[0])).then_return(decoy.mock(cls=Task))
    decoy.when(state_view.tasks.get_finished(task_ids[0])).then_return(
        FinishedTask(
            id=task_ids[0],
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=_vacuum_pressure_error(created_timestamp),
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id("task1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        _start_pressure_command(created_timestamp)
    )
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )

    result = await subject.execute(data)

    assert isinstance(result, DefinedErrorData)
    assert isinstance(result.public, VacuumPressureNotReachedError)
    decoy.verify(await run_control.wait_for_tasks(task_ids))


async def test_wait_for_tasks_returns_first_defined_error_when_all_recoverable(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """Every recoverable failure should still fail waitForTasks as defined."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        model_utils=ModelUtils(),
        resolvers=[VacuumModuleAssociatedCommandRecoveryResolver()],
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()
    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return(task_ids)
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(False)
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )
    for index, task_id in enumerate(task_ids, start=1):
        origin_id = f"start-command-{index}"
        decoy.when(state_view.tasks.get(task_id)).then_return(decoy.mock(cls=Task))
        decoy.when(state_view.tasks.get_finished(task_id)).then_return(
            FinishedTask(
                id=task_id,
                createdAt=matchers.Anything(),
                finishedAt=matchers.Anything(),
                error=_vacuum_pressure_error(created_timestamp, f"{task_id}-error"),
            )
        )
        decoy.when(state_view.tasks.get_originating_command_id(task_id)).then_return(
            origin_id
        )
        decoy.when(state_view.commands.get(origin_id)).then_return(
            _start_pressure_command(
                created_timestamp, command_id=origin_id, task_id=task_id
            )
        )

    result = await subject.execute(data)

    assert isinstance(result, DefinedErrorData)
    assert isinstance(result.public, VacuumPressureNotReachedError)
    decoy.verify(await run_control.wait_for_tasks(task_ids))


async def test_wait_for_tasks_raises_when_recoverable_and_unrecoverable_mixed(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """A mixed recoverable and unrecoverable wait should cancel the protocol."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        model_utils=ModelUtils(),
        resolvers=[VacuumModuleAssociatedCommandRecoveryResolver()],
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()
    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return(task_ids)
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery(task_ids)
    ).then_return(False)
    decoy.when(state_view.tasks.get(task_ids[0])).then_return(decoy.mock(cls=Task))
    decoy.when(state_view.tasks.get(task_ids[1])).then_return(decoy.mock(cls=Task))
    decoy.when(state_view.tasks.get_finished(task_ids[0])).then_return(
        FinishedTask(
            id=task_ids[0],
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=_vacuum_pressure_error(created_timestamp, "task1-error"),
        )
    )
    decoy.when(state_view.tasks.get_finished(task_ids[1])).then_return(
        FinishedTask(
            id=task_ids[1],
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=_unrecoverable_task_error(created_timestamp, "task2-error"),
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id("task1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        _start_pressure_command(created_timestamp)
    )
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )

    with pytest.raises(TaskFailedError) as exc_info:
        await subject.execute(data)

    assert exc_info.value.message == "2 tasks failed."
    decoy.verify(await run_control.wait_for_tasks(task_ids))


class _FakeStartResult(BaseModel):
    taskId: str = "restarted-task"


class _FakeStartImpl:
    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(self, params: object) -> SuccessData[_FakeStartResult]:
        return SuccessData(public=_FakeStartResult())


class _AlwaysMapsResolver:
    """Resolver that treats every task failure as recoverable."""

    def can_handle_error(self, error: object) -> bool:
        return True

    def is_associated_command(self, command: object) -> bool:
        return True

    def get_command_id_for_async_notification(
        self,
        module_model: object,
        module_serial: str | None,
        state_view: object,
    ) -> str | None:
        return None

    def to_defined_error_data(
        self, *args: object, **kwargs: object
    ) -> DefinedErrorData[VacuumPressureNotReachedError]:
        return DefinedErrorData(
            public=VacuumPressureNotReachedError(
                id="mapped",
                createdAt=datetime.now(),
                errorInfo={
                    "mode": VacuumOperationMode.PRESSURE,
                    "target": 0.0,
                    "current": 0.0,
                },
            )
        )

    async def restart(self, command: object, **kwargs: object) -> str | None:
        impl_cls = getattr(command, "_ImplementationCls", None)
        if impl_cls is None:
            return None
        result = await impl_cls().execute(getattr(command, "params", None))
        public = getattr(result, "public", None)
        task_id = getattr(public, "taskId", None)
        return task_id if isinstance(task_id, str) else None


async def test_wait_for_tasks_fixit_reexecutes_originating_command(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """A waitForTasks fixit should re-run the originating command implementation."""
    originating_command = SimpleNamespace(
        commandType="vacuumModule/startSetVacuumPressure",
        params=SimpleNamespace(),
        _ImplementationCls=_FakeStartImpl,
    )
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        equipment=decoy.mock(cls=EquipmentHandler),
        movement=decoy.mock(cls=MovementHandler),
        model_utils=ModelUtils(),
        resolvers=[_AlwaysMapsResolver()],
    )
    original_task_ids = ["task1"]
    data = WaitForTasksParams(task_ids=original_task_ids)
    created_timestamp = datetime.now()
    wait_command = WaitForTasks.model_construct(
        id="wait-fixit-id",
        key="wait-fixit-key",
        createdAt=created_timestamp,
        commandType="waitForTasks",
        status=CommandStatus.RUNNING,
        intent=CommandIntent.FIXIT,
        params=data,
    )
    task_error = ErrorOccurrence(
        id="error",
        createdAt=created_timestamp,
        errorType="VacuumModulePressureNotReachedError",
        errorCode="3040",
        detail="Vacuum Module Target Pressure Not Reached",
        errorInfo={"mode": "pressure", "target": -800.0, "current": -4.0},
    )
    decoy.when(state_view.commands.get_running_command_id()).then_return(
        "wait-fixit-id"
    )
    decoy.when(state_view.commands.get("wait-fixit-id")).then_return(wait_command)
    decoy.when(state_view.tasks.get(original_task_ids[0])).then_return(
        decoy.mock(cls=Task)
    )
    decoy.when(state_view.tasks.get_failed_tasks(original_task_ids)).then_return(
        original_task_ids
    )
    decoy.when(state_view.tasks.get_failed_tasks(["restarted-task"])).then_return([])
    decoy.when(state_view.tasks.get_finished(original_task_ids[0])).then_return(
        FinishedTask(
            id=original_task_ids[0],
            createdAt=created_timestamp,
            finishedAt=created_timestamp,
            error=task_error,
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id("task1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        cast(Command, originating_command)
    )

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForTasksResult(task_ids=original_task_ids))
    decoy.verify(await run_control.wait_for_tasks(["restarted-task"]))


async def test_wait_for_tasks_maps_defined_error_when_retried_task_origin_is_wait(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """A task created by a waitForTasks retry must still map to a defined error."""
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        model_utils=ModelUtils(),
        resolvers=[VacuumModuleAssociatedCommandRecoveryResolver()],
    )
    created_timestamp = datetime.now()
    restarted_task_id = "restarted-task"
    data = WaitForTasksParams(task_ids=[restarted_task_id])
    wait_command = WaitForTasks.model_construct(
        id="wait-fixit-id",
        key="wait-fixit-key",
        createdAt=created_timestamp,
        commandType="waitForTasks",
        status=CommandStatus.SUCCEEDED,
        params=WaitForTasksParams(task_ids=["task1"]),
    )
    decoy.when(state_view.commands.get_running_command_id()).then_return(None)
    decoy.when(state_view.tasks.get_failed_tasks([restarted_task_id])).then_return(
        [restarted_task_id]
    )
    decoy.when(
        state_view.failed_task_failures_absorbed_by_active_recovery([restarted_task_id])
    ).then_return(False)
    decoy.when(state_view.tasks.get(restarted_task_id)).then_return(
        decoy.mock(cls=Task)
    )
    decoy.when(state_view.tasks.get_finished(restarted_task_id)).then_return(
        FinishedTask(
            id=restarted_task_id,
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=_vacuum_pressure_error(created_timestamp),
        )
    )
    decoy.when(
        state_view.tasks.get_originating_command_id(restarted_task_id)
    ).then_return("wait-fixit-id")
    decoy.when(state_view.commands.get("wait-fixit-id")).then_return(wait_command)
    decoy.when(state_view.tasks.get_originating_command_id("task1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        _start_pressure_command(created_timestamp)
    )
    decoy.when(
        state_view.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )

    result = await subject.execute(data)

    assert isinstance(result, DefinedErrorData)
    assert isinstance(result.public, VacuumPressureNotReachedError)
    decoy.verify(await run_control.wait_for_tasks([restarted_task_id]))


async def test_wait_for_tasks_fixit_restarts_start_when_failed_task_origin_is_wait(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    state_view: StateView,
) -> None:
    """A second retry must still re-run start_*, not waitForTasks."""
    originating_command = SimpleNamespace(
        id="start-command-id",
        commandType="vacuumModule/startSetVacuumPressure",
        params=SimpleNamespace(),
        _ImplementationCls=_FakeStartImpl,
    )
    subject = WaitForTasksImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
        state_view=state_view,
        equipment=decoy.mock(cls=EquipmentHandler),
        movement=decoy.mock(cls=MovementHandler),
        model_utils=ModelUtils(),
        resolvers=[_AlwaysMapsResolver()],
    )
    created_timestamp = datetime.now()
    previous_wait = WaitForTasks.model_construct(
        id="previous-wait-id",
        key="previous-wait-key",
        createdAt=created_timestamp,
        commandType="waitForTasks",
        status=CommandStatus.FAILED,
        params=WaitForTasksParams(task_ids=["task1"]),
    )
    retry_task_ids = ["retry-task"]
    data = WaitForTasksParams(task_ids=retry_task_ids)
    wait_command = WaitForTasks.model_construct(
        id="wait-fixit-id",
        key="wait-fixit-key",
        createdAt=created_timestamp,
        commandType="waitForTasks",
        status=CommandStatus.RUNNING,
        intent=CommandIntent.FIXIT,
        params=data,
    )
    decoy.when(state_view.commands.get_running_command_id()).then_return(
        "wait-fixit-id"
    )
    decoy.when(state_view.commands.get("wait-fixit-id")).then_return(wait_command)
    decoy.when(state_view.commands.get("previous-wait-id")).then_return(previous_wait)
    decoy.when(state_view.tasks.get("retry-task")).then_return(decoy.mock(cls=Task))
    decoy.when(state_view.tasks.get_failed_tasks(retry_task_ids)).then_return(
        retry_task_ids
    )
    decoy.when(state_view.tasks.get_failed_tasks(["restarted-task"])).then_return([])
    decoy.when(state_view.tasks.get_finished("retry-task")).then_return(
        FinishedTask(
            id="retry-task",
            createdAt=created_timestamp,
            finishedAt=created_timestamp,
            error=_vacuum_pressure_error(created_timestamp),
        )
    )
    decoy.when(state_view.tasks.get_originating_command_id("retry-task")).then_return(
        "previous-wait-id"
    )
    decoy.when(state_view.tasks.get_originating_command_id("task1")).then_return(
        "start-command-id"
    )
    decoy.when(state_view.commands.get("start-command-id")).then_return(
        cast(Command, originating_command)
    )

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForTasksResult(task_ids=retry_task_ids))
    decoy.verify(await run_control.wait_for_tasks(["restarted-task"]))
