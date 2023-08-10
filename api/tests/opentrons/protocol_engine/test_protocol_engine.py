"""Tests for the ProtocolEngine class."""
import inspect
from datetime import datetime
from typing import Any

import pytest
from decoy import Decoy

from opentrons_shared_data.robot.dev_types import RobotType
from opentrons.ordered_set import OrderedSet

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI, OT2HardwareControlAPI
from opentrons.hardware_control.modules import MagDeck, TempDeck
from opentrons.hardware_control.types import PauseType as HardwarePauseType
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import ProtocolEngine, commands, slot_standardization
from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.protocol_engine.types import (
    DeckType,
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    LabwareUri,
    ModuleDefinition,
    ModuleModel,
    Liquid,
)
from opentrons.protocol_engine.execution import (
    QueueWorker,
    HardwareStopper,
    DoorWatcher,
)
from opentrons.protocol_engine.resources import ModelUtils, ModuleDataProvider
from opentrons.protocol_engine.state import Config, StateStore
from opentrons.protocol_engine.plugins import AbstractPlugin, PluginStarter
from opentrons.protocol_engine.errors import ProtocolCommandFailedError, ErrorOccurrence

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    AddLiquidAction,
    AddModuleAction,
    PlayAction,
    PauseAction,
    PauseSource,
    StopAction,
    FinishAction,
    FinishErrorDetails,
    QueueCommandAction,
    HardwareStoppedAction,
    ResetTipsAction,
    FailCommandAction,
)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mock ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def plugin_starter(decoy: Decoy) -> PluginStarter:
    """Get a mock PluginStarter."""
    return decoy.mock(cls=PluginStarter)


@pytest.fixture
def queue_worker(decoy: Decoy) -> QueueWorker:
    """Get a mock QueueWorker."""
    return decoy.mock(cls=QueueWorker)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get mock ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mock HardwareControlAPI."""
    return decoy.mock(cls=OT2HardwareControlAPI)


@pytest.fixture
def hardware_stopper(decoy: Decoy) -> HardwareStopper:
    """Get a mock HardwareStopper."""
    return decoy.mock(cls=HardwareStopper)


@pytest.fixture
def door_watcher(decoy: Decoy) -> DoorWatcher:
    """Get a mock DoorWatcher."""
    return decoy.mock(cls=DoorWatcher)


@pytest.fixture
def module_data_provider(decoy: Decoy) -> ModuleDataProvider:
    """Get a mock ModuleDataProvider."""
    return decoy.mock(cls=ModuleDataProvider)


@pytest.fixture(autouse=True)
def _mock_slot_standardization_module(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out opentrons.protocol_engine.slot_standardization functions."""
    for name, func in inspect.getmembers(slot_standardization, inspect.isfunction):
        monkeypatch.setattr(slot_standardization, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_hash_command_params_module(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    hash_command_params = commands.hash_command_params
    monkeypatch.setattr(
        commands, "hash_command_params", decoy.mock(func=hash_command_params)
    )


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    model_utils: ModelUtils,
    hardware_stopper: HardwareStopper,
    door_watcher: DoorWatcher,
    module_data_provider: ModuleDataProvider,
) -> ProtocolEngine:
    """Get a ProtocolEngine test subject with its dependencies stubbed out."""
    return ProtocolEngine(
        hardware_api=hardware_api,
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        plugin_starter=plugin_starter,
        queue_worker=queue_worker,
        model_utils=model_utils,
        hardware_stopper=hardware_stopper,
        door_watcher=door_watcher,
        module_data_provider=module_data_provider,
    )


def test_create_starts_background_tasks(
    decoy: Decoy,
    queue_worker: QueueWorker,
    door_watcher: DoorWatcher,
    subject: ProtocolEngine,
) -> None:
    """It should start the queue worker upon creation."""
    decoy.verify(queue_worker.start(), door_watcher.start())


def test_add_command(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
) -> None:
    """It should add a command to the state from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    original_request = commands.WaitForResumeCreate(
        params=commands.WaitForResumeParams()
    )
    standardized_request = commands.HomeCreate(params=commands.HomeParams())
    queued = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        params=commands.HomeParams(),
    )

    robot_type: RobotType = "OT-3 Standard"
    decoy.when(state_store.config).then_return(
        Config(robot_type=robot_type, deck_type=DeckType.OT3_STANDARD)
    )

    decoy.when(
        slot_standardization.standardize_command(original_request, robot_type)
    ).then_return(standardized_request)

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)
    decoy.when(state_store.commands.get_latest_command_hash()).then_return("abc")
    decoy.when(
        commands.hash_command_params(create=standardized_request, last_hash="abc")
    ).then_return("123")

    def _stub_queued(*_a: object, **_k: object) -> None:
        decoy.when(state_store.commands.get("command-id")).then_return(queued)

    decoy.when(
        state_store.commands.validate_action_allowed(
            QueueCommandAction(
                command_id="command-id",
                created_at=created_at,
                request=standardized_request,
                request_hash="123",
            )
        )
    ).then_return(
        QueueCommandAction(
            command_id="command-id-validated",
            created_at=created_at,
            request=standardized_request,
            request_hash="456",
        )
    )

    decoy.when(
        action_dispatcher.dispatch(
            QueueCommandAction(
                command_id="command-id-validated",
                created_at=created_at,
                request=standardized_request,
                request_hash="456",
            )
        ),
    ).then_do(_stub_queued)

    result = subject.add_command(original_request)

    assert result == queued


async def test_add_and_execute_command(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
) -> None:
    """It should add and execute a command from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    original_request = commands.WaitForResumeCreate(
        params=commands.WaitForResumeParams()
    )
    standardized_request = commands.HomeCreate(params=commands.HomeParams())
    queued = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        params=commands.HomeParams(),
    )
    completed = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=created_at,
        params=commands.HomeParams(),
    )

    robot_type: RobotType = "OT-3 Standard"
    decoy.when(state_store.config).then_return(
        Config(robot_type=robot_type, deck_type=DeckType.OT3_STANDARD)
    )

    decoy.when(
        slot_standardization.standardize_command(original_request, robot_type)
    ).then_return(standardized_request)

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)

    def _stub_queued(*_a: object, **_k: object) -> None:
        decoy.when(state_store.commands.get("command-id")).then_return(queued)

    def _stub_completed(*_a: object, **_k: object) -> bool:
        decoy.when(state_store.commands.get("command-id")).then_return(completed)
        return True

    decoy.when(
        state_store.commands.validate_action_allowed(
            QueueCommandAction(
                command_id="command-id",
                created_at=created_at,
                request=standardized_request,
                request_hash=None,
            )
        )
    ).then_return(
        QueueCommandAction(
            command_id="command-id-validated",
            created_at=created_at,
            request=standardized_request,
            request_hash=None,
        )
    )

    decoy.when(
        action_dispatcher.dispatch(
            QueueCommandAction(
                command_id="command-id-validated",
                created_at=created_at,
                request=standardized_request,
                request_hash=None,
            )
        )
    ).then_do(_stub_queued)

    decoy.when(
        await state_store.wait_for(
            condition=state_store.commands.get_command_is_final,
            command_id="command-id",
        ),
    ).then_do(_stub_completed)

    result = await subject.add_and_execute_command(original_request)

    assert result == completed


def test_play(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    hardware_api: HardwareControlAPI,
    subject: ProtocolEngine,
) -> None:
    """It should be able to start executing queued commands."""
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2021, month=1, day=1)
    )
    decoy.when(
        state_store.commands.validate_action_allowed(
            PlayAction(requested_at=datetime(year=2021, month=1, day=1))
        ),
    ).then_return(PlayAction(requested_at=datetime(year=2022, month=2, day=2)))

    subject.play()

    decoy.verify(
        action_dispatcher.dispatch(
            PlayAction(requested_at=datetime(year=2022, month=2, day=2))
        ),
        hardware_api.resume(HardwarePauseType.PAUSE),
    )


def test_play_blocked_by_door(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    hardware_api: HardwareControlAPI,
    subject: ProtocolEngine,
) -> None:
    """It should not pause instead of resuming the hardware if blocked by door."""
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2021, month=1, day=1)
    )
    decoy.when(
        state_store.commands.validate_action_allowed(
            PlayAction(requested_at=datetime(year=2021, month=1, day=1))
        ),
    ).then_return(PlayAction(requested_at=datetime(year=2022, month=2, day=2)))
    decoy.when(state_store.commands.get_is_door_blocking()).then_return(True)

    subject.play()

    decoy.verify(hardware_api.resume(HardwarePauseType.PAUSE), times=0)
    decoy.verify(
        action_dispatcher.dispatch(
            PlayAction(requested_at=datetime(year=2022, month=2, day=2))
        ),
        hardware_api.pause(HardwarePauseType.PAUSE),
    )


def test_pause(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    hardware_api: HardwareControlAPI,
    subject: ProtocolEngine,
) -> None:
    """It should be able to pause executing queued commands."""
    expected_action = PauseAction(source=PauseSource.CLIENT)

    decoy.when(
        state_store.commands.validate_action_allowed(expected_action),
    ).then_return(expected_action)

    subject.pause()

    decoy.verify(
        action_dispatcher.dispatch(expected_action),
        hardware_api.pause(HardwarePauseType.PAUSE),
    )


@pytest.mark.parametrize("drop_tips_and_home", [True, False])
@pytest.mark.parametrize("set_run_status", [True, False])
async def test_finish(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
    drop_tips_and_home: bool,
    set_run_status: bool,
    model_utils: ModelUtils,
    state_store: StateStore,
    door_watcher: DoorWatcher,
) -> None:
    """It should be able to gracefully tell the engine it's done."""
    completed_at = datetime(2021, 1, 1, 0, 0)

    decoy.when(model_utils.get_timestamp()).then_return(completed_at)
    decoy.when(state_store.commands.state.stopped_by_estop).then_return(False)

    await subject.finish(
        drop_tips_and_home=drop_tips_and_home,
        set_run_status=set_run_status,
    )

    decoy.verify(
        action_dispatcher.dispatch(FinishAction(set_run_status=set_run_status)),
        await queue_worker.join(),
        door_watcher.stop(),
        await hardware_stopper.do_stop_and_recover(
            drop_tips_and_home=drop_tips_and_home
        ),
        await plugin_starter.stop(),
        action_dispatcher.dispatch(
            HardwareStoppedAction(completed_at=completed_at, finish_error_details=None)
        ),
    )


async def test_finish_with_defaults(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
    state_store: StateStore,
) -> None:
    """It should be able to gracefully tell the engine it's done."""
    decoy.when(state_store.commands.state.stopped_by_estop).then_return(False)
    await subject.finish()

    decoy.verify(
        action_dispatcher.dispatch(FinishAction(set_run_status=True)),
        await hardware_stopper.do_stop_and_recover(drop_tips_and_home=True),
    )


@pytest.mark.parametrize("stopped_by_estop", [True, False])
async def test_finish_with_error(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
    door_watcher: DoorWatcher,
    state_store: StateStore,
    stopped_by_estop: bool,
) -> None:
    """It should be able to tell the engine it's finished because of an error."""
    error = RuntimeError("oh no")
    expected_error_details = FinishErrorDetails(
        error_id="error-id",
        created_at=datetime(year=2021, month=1, day=1),
        error=error,
    )

    decoy.when(state_store.commands.state.stopped_by_estop).then_return(
        stopped_by_estop
    )
    decoy.when(model_utils.generate_id()).then_return("error-id")
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2021, month=1, day=1), datetime(year=2022, month=2, day=2)
    )

    await subject.finish(error=error)

    decoy.verify(
        action_dispatcher.dispatch(
            FinishAction(error_details=expected_error_details, set_run_status=True)
        ),
        await queue_worker.join(),
        door_watcher.stop(),
        await hardware_stopper.do_stop_and_recover(
            drop_tips_and_home=not stopped_by_estop
        ),
        await plugin_starter.stop(),
        action_dispatcher.dispatch(
            HardwareStoppedAction(
                completed_at=datetime(year=2022, month=2, day=2),
                finish_error_details=None,
            )
        ),
    )


async def test_finish_with_estop_error_will_not_drop_tip_and_home(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
    door_watcher: DoorWatcher,
) -> None:
    """It should be able to tell the engine it's finished because of an error and will not drop tip and home."""
    error = ProtocolCommandFailedError(
        original_error=ErrorOccurrence.construct(  # type: ignore[call-arg]
            wrappedErrors=[
                ErrorOccurrence.construct(errorCode="3008")  # type: ignore[call-arg]
            ]
        )
    )
    expected_error_details = FinishErrorDetails(
        error_id="error-id",
        created_at=datetime(year=2021, month=1, day=1),
        error=error,
    )

    decoy.when(model_utils.generate_id()).then_return("error-id")
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2021, month=1, day=1), datetime(year=2022, month=2, day=2)
    )

    await subject.finish(error=error)

    decoy.verify(
        action_dispatcher.dispatch(
            FinishAction(error_details=expected_error_details, set_run_status=True)
        ),
        await queue_worker.join(),
        door_watcher.stop(),
        await hardware_stopper.do_stop_and_recover(drop_tips_and_home=False),
        await plugin_starter.stop(),
        action_dispatcher.dispatch(
            HardwareStoppedAction(
                completed_at=datetime(year=2022, month=2, day=2),
                finish_error_details=None,
            )
        ),
    )


async def test_finish_stops_hardware_if_queue_worker_join_fails(
    decoy: Decoy,
    queue_worker: QueueWorker,
    hardware_stopper: HardwareStopper,
    door_watcher: DoorWatcher,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    subject: ProtocolEngine,
    model_utils: ModelUtils,
    state_store: StateStore,
) -> None:
    """It should be able to stop the engine."""
    exception = RuntimeError("oh no")
    decoy.when(
        await queue_worker.join(),
    ).then_raise(exception)

    decoy.when(state_store.commands.state.stopped_by_estop).then_return(False)

    error_id = "error-id"
    completed_at = datetime(2021, 1, 1, 0, 0)

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(completed_at)

    await subject.finish()

    decoy.verify(
        action_dispatcher.dispatch(FinishAction()),
        # await queue_worker.join() should be called, and should raise, here.
        # We can't verify that step in the sequence here because of a Decoy limitation.
        door_watcher.stop(),
        await hardware_stopper.do_stop_and_recover(drop_tips_and_home=True),
        await plugin_starter.stop(),
        action_dispatcher.dispatch(
            HardwareStoppedAction(
                completed_at=completed_at,
                finish_error_details=FinishErrorDetails(
                    error=exception, error_id="error-id", created_at=completed_at
                ),
            )
        ),
    )


async def test_wait_until_complete(
    decoy: Decoy,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine after waiting for commands to complete."""
    await subject.wait_until_complete()

    decoy.verify(
        await state_store.wait_for(
            condition=state_store.commands.get_all_commands_final
        )
    )


async def test_stop(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_stopper: HardwareStopper,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine and halt the hardware."""
    expected_action = StopAction()

    decoy.when(
        state_store.commands.validate_action_allowed(expected_action),
    ).then_return(expected_action)

    await subject.stop()

    decoy.verify(
        action_dispatcher.dispatch(expected_action),
        queue_worker.cancel(),
        await hardware_stopper.do_halt(),
    )


@pytest.mark.parametrize("maintenance_run", [True, False])
async def test_estop_during_command(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    state_store: StateStore,
    subject: ProtocolEngine,
    model_utils: ModelUtils,
    maintenance_run: bool,
) -> None:
    """It should be able to stop the engine."""
    timestamp = datetime(2021, 1, 1, 0, 0)
    command_id = "command_fake_id"
    error_id = "fake_error_id"
    fake_command_set = OrderedSet(["fake-id-1", "fake-id-1"])

    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(state_store.commands.get_is_stopped()).then_return(False)
    decoy.when(state_store.commands.state.running_command_id).then_return(command_id)
    decoy.when(state_store.commands.state.queued_command_ids).then_return(
        fake_command_set
    )

    expected_action = FailCommandAction(
        command_id=command_id,
        error_id=error_id,
        failed_at=timestamp,
        error=EStopActivatedError(message="Estop Activated"),
    )
    expected_action_2 = FailCommandAction(
        command_id=fake_command_set.head(),
        error_id=error_id,
        failed_at=timestamp,
        error=EStopActivatedError(message="Estop Activated"),
    )

    subject.estop(maintenance_run=maintenance_run)

    decoy.verify(
        action_dispatcher.dispatch(action=expected_action),
        action_dispatcher.dispatch(action=expected_action_2),
        queue_worker.cancel(),
    )


@pytest.mark.parametrize("maintenance_run", [True, False])
async def test_estop_without_command(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    state_store: StateStore,
    subject: ProtocolEngine,
    model_utils: ModelUtils,
    maintenance_run: bool,
) -> None:
    """It should be able to stop the engine."""
    timestamp = datetime(2021, 1, 1, 0, 0)
    error_id = "fake_error_id"

    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(state_store.commands.get_is_stopped()).then_return(False)
    decoy.when(state_store.commands.state.running_command_id).then_return(None)

    expected_stop = StopAction(from_estop=True)
    expected_hardware_stop = HardwareStoppedAction(
        completed_at=timestamp,
        finish_error_details=FinishErrorDetails(
            error=EStopActivatedError(message="Estop Activated"),
            error_id=error_id,
            created_at=timestamp,
        ),
    )

    decoy.when(
        state_store.commands.validate_action_allowed(expected_stop),
    ).then_return(expected_stop)

    subject.estop(maintenance_run=maintenance_run)

    decoy.verify(
        action_dispatcher.dispatch(expected_stop), times=1 if maintenance_run else 0
    )
    decoy.verify(
        action_dispatcher.dispatch(expected_hardware_stop),
        times=1 if maintenance_run else 0,
    )
    decoy.verify(queue_worker.cancel(), times=1 if maintenance_run else 0)


def test_add_plugin(
    decoy: Decoy,
    plugin_starter: PluginStarter,
    subject: ProtocolEngine,
) -> None:
    """It should add a plugin to the PluginStarter."""
    plugin = decoy.mock(cls=AbstractPlugin)

    subject.add_plugin(plugin)

    decoy.verify(plugin_starter.start(plugin))


def test_add_labware_offset(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should have the labware offset request resolved and added to state."""
    request = LabwareOffsetCreate(
        definitionUri="definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    standardized_request = LabwareOffsetCreate(
        definitionUri="standardized-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=LabwareOffsetVector(x=2, y=3, z=4),
    )

    id = "labware-offset-id"
    created_at = datetime(year=2021, month=11, day=15)

    expected_result = LabwareOffset(
        id=id,
        createdAt=created_at,
        definitionUri=standardized_request.definitionUri,
        location=standardized_request.location,
        vector=standardized_request.vector,
    )

    robot_type: RobotType = "OT-3 Standard"
    decoy.when(state_store.config).then_return(
        Config(robot_type=robot_type, deck_type=DeckType.OT3_STANDARD)
    )
    decoy.when(
        slot_standardization.standardize_labware_offset(request, robot_type)
    ).then_return(standardized_request)
    decoy.when(model_utils.generate_id()).then_return(id)
    decoy.when(model_utils.get_timestamp()).then_return(created_at)
    decoy.when(
        state_store.labware.get_labware_offset(labware_offset_id=id)
    ).then_return(expected_result)

    result = subject.add_labware_offset(
        request=LabwareOffsetCreate(
            definitionUri="definition-uri",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
    )

    assert result == expected_result

    decoy.verify(
        action_dispatcher.dispatch(
            AddLabwareOffsetAction(
                labware_offset_id=id,
                created_at=created_at,
                request=standardized_request,
            )
        )
    )


def test_add_labware_definition(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    state_store: StateStore,
    subject: ProtocolEngine,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should dispatch an AddLabwareDefinition action."""

    def _stub_get_definition_uri(*args: Any, **kwargs: Any) -> None:
        decoy.when(
            state_store.labware.get_uri_from_definition(well_plate_def)
        ).then_return(LabwareUri("some/definition/uri"))

    decoy.when(
        action_dispatcher.dispatch(
            AddLabwareDefinitionAction(definition=well_plate_def)
        )
    ).then_do(_stub_get_definition_uri)

    result = subject.add_labware_definition(well_plate_def)

    assert result == "some/definition/uri"


def test_add_liquid(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should dispatch an AddLiquidAction action."""
    subject.add_liquid(
        id="water-id", name="water", description="water desc", color=None
    )

    decoy.verify(
        action_dispatcher.dispatch(
            AddLiquidAction(
                liquid=Liquid(
                    id="water-id", displayName="water", description="water desc"
                )
            )
        )
    )


async def test_use_attached_temp_and_mag_modules(
    decoy: Decoy,
    module_data_provider: ModuleDataProvider,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
    tempdeck_v1_def: ModuleDefinition,
    magdeck_v2_def: ModuleDefinition,
) -> None:
    """It should be able to load attached hardware modules directly into state."""
    mod_1 = decoy.mock(cls=TempDeck)
    mod_2 = decoy.mock(cls=MagDeck)

    decoy.when(mod_1.device_info).then_return({"serial": "serial-1"})
    decoy.when(mod_2.device_info).then_return({"serial": "serial-2"})
    decoy.when(mod_1.model()).then_return("temperatureModuleV1")
    decoy.when(mod_2.model()).then_return("magneticModuleV2")

    decoy.when(mod_1.live_data).then_return({"status": "some-status", "data": {}})
    decoy.when(mod_2.live_data).then_return({"status": "other-status", "data": {}})

    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V1)
    ).then_return(tempdeck_v1_def)

    decoy.when(
        module_data_provider.get_definition(ModuleModel.MAGNETIC_MODULE_V2)
    ).then_return(magdeck_v2_def)

    await subject.use_attached_modules(
        {
            "module-1": mod_1,
            "module-2": mod_2,
        }
    )

    decoy.verify(
        action_dispatcher.dispatch(
            AddModuleAction(
                module_id="module-1",
                serial_number="serial-1",
                definition=tempdeck_v1_def,
                module_live_data={"status": "some-status", "data": {}},
            )
        ),
        action_dispatcher.dispatch(
            AddModuleAction(
                module_id="module-2",
                serial_number="serial-2",
                definition=magdeck_v2_def,
                module_live_data={"status": "other-status", "data": {}},
            ),
        ),
    )


def test_reset_tips(
    decoy: Decoy, action_dispatcher: ActionDispatcher, subject: ProtocolEngine
) -> None:
    """It should reset tip state by dispatching an action."""
    subject.reset_tips(labware_id="cool-labware")

    decoy.verify(
        action_dispatcher.dispatch(ResetTipsAction(labware_id="cool-labware")),
        times=1,
    )
