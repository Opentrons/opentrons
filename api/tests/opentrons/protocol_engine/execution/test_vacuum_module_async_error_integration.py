"""Integration tests for vacuum async errors through associated-command recovery."""

import asyncio
from datetime import datetime
from typing import AsyncGenerator, List, Optional

import pytest

from opentrons_shared_data.deck.types import DeckDefinitionV5
from opentrons_shared_data.errors.exceptions import EnumeratedError
from opentrons_shared_data.robot import load as load_robot

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.errors import (
    PressureNotReached,
    WasteContainerFull,
)
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver
from opentrons.hardware_control import ExecutionManager, modules
from opentrons.hardware_control.modules.vacuum_module import (
    SIMULATING_POLL_PERIOD,
    VacuumModuleReader,
)
from opentrons.hardware_control.poller import Poller
from opentrons.protocol_engine import actions
from opentrons.protocol_engine.actions.action_dispatcher import ActionDispatcher
from opentrons.protocol_engine.commands import CommandStatus
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureCreate,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from opentrons.protocol_engine.error_recovery_policy import (
    ErrorRecoveryType,
)
from opentrons.protocol_engine.execution.associated_command_error_recovery import (
    AssociatedCommandErrorRecoveryOrchestrator,
    default_associated_command_recovery_resolvers,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import (
    DeckType,
    EngineStatus,
    ModuleDefinition,
    ModuleModel,
)
from opentrons.util.change_notifier import ChangeNotifier


def _wait_for_recovery_policy(
    config: Config,
    failed_command: object,
    defined_error_data: Optional[object],
) -> ErrorRecoveryType:
    if defined_error_data is not None:
        return ErrorRecoveryType.WAIT_FOR_RECOVERY
    return ErrorRecoveryType.FAIL_RUN


@pytest.fixture
def ot3_engine_config() -> Config:
    """Get a ProtocolEngine config for the Flex."""
    return Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )


@pytest.fixture
def state_store(
    ot3_engine_config: Config,
    ot3_standard_deck_def: DeckDefinitionV5,
) -> StateStore:
    """Get a real StateStore for integration tests."""
    return StateStore(
        config=ot3_engine_config,
        deck_definition=ot3_standard_deck_def,
        robot_definition=load_robot("OT-3 Standard"),
        deck_fixed_labware=[],
        change_notifier=ChangeNotifier(),
        is_door_open=False,
        error_recovery_policy=_wait_for_recovery_policy,
    )


@pytest.fixture
def action_dispatcher(state_store: StateStore) -> ActionDispatcher:
    """Get an action dispatcher wired to the state store."""
    return ActionDispatcher(state_store)


@pytest.fixture
def recovery_orchestrator(
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
) -> AssociatedCommandErrorRecoveryOrchestrator:
    """Get the associated-command recovery orchestrator."""
    orchestrator = AssociatedCommandErrorRecoveryOrchestrator(
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        resolvers=default_associated_command_recovery_resolvers(),
        model_utils=ModelUtils(),
    )
    action_dispatcher.add_handler(orchestrator)
    return orchestrator


@pytest.fixture
async def sim_vacuum_for_recovery(
    recovery_orchestrator: AssociatedCommandErrorRecoveryOrchestrator,
) -> AsyncGenerator[tuple[modules.VacuumModule, List[Exception]], None]:
    """Build a sim vacuum module that forwards async errors into recovery."""
    usb_port = USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_vacuummodule0",
    )
    driver = SimulatingDriver(serial_number="dummySerialFS")
    reader = VacuumModuleReader(driver=driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    received_errors: List[Exception] = []

    def error_callback(
        exc: Exception,
        model: str,
        port: str,
        serial: str | None,
    ) -> None:
        received_errors.append(exc)
        recovery_orchestrator.try_recover_from_module_error(
            module_model=ModuleModel.VACUUM_MODULE_V1,
            module_serial=serial,
            error=EnumeratedError.ensure(exc),
        )

    vacuum = modules.VacuumModule(
        port="/dev/ot_module_sim_vacuummodule0",
        usb_port=usb_port,
        driver=driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialFS",
            "model": "nff",
            "version": "vacuum-fw",
            "reset_reason": "0",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
        error_callback=error_callback,
        disconnected_callback=lambda model, port, serial: None,
    )

    await poller.start()
    try:
        yield vacuum, received_errors
    finally:
        await vacuum.cleanup()


def _seed_succeeded_start_pressure_command(
    state_store: StateStore,
    vacuum_module_v1_def: ModuleDefinition,
) -> None:
    """Load a vacuum module and record a succeeded startSetVacuumPressure command."""
    module_id = "vacuum-module-id"
    command_id = "start-command-id"
    created_at = datetime(year=2025, month=1, day=1)
    started_at = datetime(year=2025, month=1, day=2)
    completed_at = datetime(year=2025, month=1, day=3)

    state_store.handle_action(actions.PlayAction(requested_at=created_at))
    state_store.handle_action(
        actions.AddModuleAction(
            module_id=module_id,
            serial_number="dummySerialFS",
            definition=vacuum_module_v1_def,
            module_live_data={"status": "idle", "data": {}},
        )
    )
    state_store.handle_action(
        actions.QueueCommandAction(
            command_id=command_id,
            created_at=created_at,
            request=StartSetVacuumPressureCreate(
                params=StartSetVacuumPressureParams(
                    moduleId=module_id,
                    gaugePressure=-50.0,
                    ventAfter=True,
                    taskId="task-1",
                ),
                key="start-command-key",
            ),
            request_hash=None,
        )
    )
    state_store.handle_action(
        actions.RunCommandAction(command_id=command_id, started_at=started_at)
    )

    state_update = update_types.StateUpdate()
    state_update.record_module_background_command(module_id, command_id)

    succeeded_command = StartSetVacuumPressure.model_construct(
        id=command_id,
        key="start-command-key",
        createdAt=created_at,
        startedAt=started_at,
        completedAt=completed_at,
        commandType="vacuumModule/startSetVacuumPressure",
        status=CommandStatus.SUCCEEDED,
        params=StartSetVacuumPressureParams(
            moduleId=module_id,
            gaugePressure=-50.0,
            ventAfter=True,
            taskId="task-1",
        ),
        result=StartSetVacuumPressureResult(taskId="task-1"),
    )
    state_store.handle_action(
        actions.SucceedCommandAction(
            command=succeeded_command,
            state_update=state_update,
        )
    )


@pytest.mark.parametrize(
    ("driver_error", "expected_error_type"),
    [
        (
            WasteContainerFull("port", "async ERR401:waste full", "M121"),
            "vacuumCarboyFull",
        ),
        (
            PressureNotReached("port", "async ERR400:pressure not reached", "M121"),
            "vacuumPressureNotReached",
        ),
    ],
)
async def test_injected_async_error_enters_associated_command_recovery(
    state_store: StateStore,
    sim_vacuum_for_recovery: tuple[modules.VacuumModule, List[Exception]],
    vacuum_module_v1_def: ModuleDefinition,
    driver_error: WasteContainerFull | PressureNotReached,
    expected_error_type: str,
) -> None:
    """Injected HW errors should enter recovery without failing the start command."""
    vacuum, received_errors = sim_vacuum_for_recovery
    driver = vacuum._driver
    assert isinstance(driver, SimulatingDriver)

    _seed_succeeded_start_pressure_command(state_store, vacuum_module_v1_def)

    driver.inject_async_error(driver_error)
    await asyncio.sleep(SIMULATING_POLL_PERIOD * 3)

    assert len(received_errors) == 1
    assert state_store.commands.get_status() == EngineStatus.AWAITING_RECOVERY

    recovering_command = state_store.commands.get("start-command-id")
    assert recovering_command.status == CommandStatus.SUCCEEDED
    assert recovering_command.error is not None
    assert recovering_command.error.errorType == expected_error_type

    recovery_target = state_store.commands.get_recovery_target()
    assert recovery_target is not None
    assert recovery_target.command_id == "start-command-id"
