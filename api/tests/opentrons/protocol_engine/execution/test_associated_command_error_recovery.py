"""Tests for associated-command error recovery orchestration."""

from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import VacuumModuleWasteFullError

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    BeginAwaitingRecoveryAction,
    FinishTaskAction,
)
from opentrons.protocol_engine.commands.command import CommandStatus
from opentrons.protocol_engine.commands.vacuum_module.recovery import (
    VacuumModuleAssociatedCommandRecoveryResolver,
)
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from opentrons.protocol_engine.error_recovery_policy import (
    ErrorRecoveryType,
    never_recover,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.execution.associated_command_error_recovery import (
    AssociatedCommandErrorRecoveryOrchestrator,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import LoadedModule, ModuleModel


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mock action dispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock model utils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def vacuum_resolver() -> VacuumModuleAssociatedCommandRecoveryResolver:
    """Get the vacuum associated-command recovery resolver."""
    return VacuumModuleAssociatedCommandRecoveryResolver()


@pytest.fixture
def subject(
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    vacuum_resolver: VacuumModuleAssociatedCommandRecoveryResolver,
) -> AssociatedCommandErrorRecoveryOrchestrator:
    """Get an orchestrator wired with the vacuum resolver."""
    return AssociatedCommandErrorRecoveryOrchestrator(
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        resolvers=[vacuum_resolver],
        model_utils=model_utils,
    )


def _start_command(timestamp: datetime) -> StartSetVacuumPressure:
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
        ),
        result=StartSetVacuumPressureResult(taskId="task-1"),
    )


def test_finish_task_dispatches_fail_for_associated_start_command(
    decoy: Decoy,
    subject: AssociatedCommandErrorRecoveryOrchestrator,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should fail the originating start command when its task errors."""
    timestamp = datetime.now()
    start_command = _start_command(timestamp)
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")
    decoy.when(state_store.commands.get_is_awaiting_recovery()).then_return(False)
    decoy.when(state_store.commands.get_is_terminal()).then_return(False)
    decoy.when(state_store.commands.get("start-command-id")).then_return(start_command)
    decoy.when(state_store.commands.get_error_recovery_policy()).then_return(
        lambda config, failed_command, defined_error_data: (
            ErrorRecoveryType.WAIT_FOR_RECOVERY
        )
    )
    decoy.when(
        state_store.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=True,
        )
    )
    decoy.when(state_store.tasks.get_originating_command_id("task-1")).then_return(
        "start-command-id"
    )

    task_error = ErrorOccurrence(
        id="task-error-id",
        createdAt=timestamp,
        errorType="VacuumModuleWasteFullError",
        errorCode="3041",
        detail="Vacuum Module Waste Container Full",
    )

    subject.handle_action(
        FinishTaskAction(task_id="task-1", finished_at=timestamp, error=task_error)
    )

    decoy.verify(
        action_dispatcher.dispatch(
            BeginAwaitingRecoveryAction(
                command_id="start-command-id",
                command=start_command,
                error_id="defined-error-id",
                failed_at=timestamp,
                error=matchers.Anything(),
                notes=matchers.Anything(),
                type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
            )
        ),
        times=1,
    )


def test_try_recover_from_module_error_uses_resolver(
    decoy: Decoy,
    subject: AssociatedCommandErrorRecoveryOrchestrator,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should delegate late async notifications to module resolvers."""
    timestamp = datetime.now()
    start_command = _start_command(timestamp)
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")
    decoy.when(state_store.commands.get_is_awaiting_recovery()).then_return(False)
    decoy.when(state_store.commands.get_is_terminal()).then_return(False)
    decoy.when(state_store.commands.get("start-command-id")).then_return(start_command)
    decoy.when(state_store.commands.get_error_recovery_policy()).then_return(
        lambda config, failed_command, defined_error_data: (
            ErrorRecoveryType.WAIT_FOR_RECOVERY
        )
    )
    decoy.when(
        state_store.modules.get_has_module_probably_matching_hardware_details(
            ModuleModel.VACUUM_MODULE_V1, "VM123"
        )
    ).then_return(True)
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule.model_construct(
                id="vacuum-module-id",
                model=ModuleModel.VACUUM_MODULE_V1,
                serialNumber="VM123",
            )
        ]
    )
    decoy.when(
        state_store.tasks.get_last_background_command_id("vacuum-module-id")
    ).then_return("start-command-id")
    decoy.when(
        state_store.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=False,
        )
    )

    recovered = subject.try_recover_from_module_error(
        module_model=ModuleModel.VACUUM_MODULE_V1,
        module_serial="VM123",
        error=VacuumModuleWasteFullError(serial="VM123"),
    )

    assert recovered is True
    decoy.verify(
        action_dispatcher.dispatch(
            BeginAwaitingRecoveryAction(
                command_id="start-command-id",
                command=start_command,
                error_id="defined-error-id",
                failed_at=timestamp,
                error=matchers.Anything(),
                notes=matchers.Anything(),
                type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
            )
        ),
        times=1,
    )


def test_orchestrator_skips_unhandled_errors(
    decoy: Decoy,
    subject: AssociatedCommandErrorRecoveryOrchestrator,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
) -> None:
    """It should ignore task failures that no resolver handles."""
    timestamp = datetime.now()
    decoy.when(state_store.tasks.get_originating_command_id("task-1")).then_return(
        "start-command-id"
    )

    subject.handle_action(
        FinishTaskAction(
            task_id="task-1",
            finished_at=timestamp,
            error=ErrorOccurrence(
                id="error",
                createdAt=timestamp,
                errorType="SomeOtherError",
                errorCode="9999",
                detail="detail",
            ),
        )
    )

    decoy.verify(action_dispatcher.dispatch(matchers.Anything()), times=0)


def test_try_recover_from_module_error_returns_false_for_non_recoverable_policy(
    decoy: Decoy,
    subject: AssociatedCommandErrorRecoveryOrchestrator,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should not enter recovery when the policy says to fail the run."""
    timestamp = datetime.now()
    start_command = _start_command(timestamp)
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")
    decoy.when(state_store.commands.get_is_awaiting_recovery()).then_return(False)
    decoy.when(state_store.commands.get_is_terminal()).then_return(False)
    decoy.when(state_store.commands.get("start-command-id")).then_return(start_command)
    decoy.when(state_store.commands.get_error_recovery_policy()).then_return(
        never_recover
    )
    decoy.when(
        state_store.modules.get_has_module_probably_matching_hardware_details(
            ModuleModel.VACUUM_MODULE_V1, "VM123"
        )
    ).then_return(True)
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule.model_construct(
                id="vacuum-module-id",
                model=ModuleModel.VACUUM_MODULE_V1,
                serialNumber="VM123",
            )
        ]
    )
    decoy.when(
        state_store.tasks.get_last_background_command_id("vacuum-module-id")
    ).then_return("start-command-id")
    decoy.when(
        state_store.modules.get_vacuum_module_substate("vacuum-module-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-module-id"),
            pump_engaged=False,
        )
    )

    recovered = subject.try_recover_from_module_error(
        module_model=ModuleModel.VACUUM_MODULE_V1,
        module_serial="VM123",
        error=VacuumModuleWasteFullError(serial="VM123"),
    )

    assert recovered is False
    decoy.verify(action_dispatcher.dispatch(matchers.Anything()), times=0)
