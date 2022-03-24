"""Tests for the ProtocolEngine class."""
import pytest

from datetime import datetime
from decoy import Decoy
from typing import Any

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import MagDeck, TempDeck
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import ProtocolEngine, commands
from opentrons.protocol_engine.types import (
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    LabwareUri,
    ModuleDefinition,
    ModuleModel,
)
from opentrons.protocol_engine.execution import (
    QueueWorker,
    HardwareStopper,
    HardwareEventForwarder,
)
from opentrons.protocol_engine.resources import ModelUtils, ModuleDataProvider
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.plugins import AbstractPlugin, PluginStarter

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    AddModuleAction,
    PlayAction,
    PauseAction,
    PauseSource,
    StopAction,
    FinishAction,
    FinishErrorDetails,
    QueueCommandAction,
    HardwareStoppedAction,
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
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def hardware_stopper(decoy: Decoy) -> HardwareStopper:
    """Get a mock HardwareStopper."""
    return decoy.mock(cls=HardwareStopper)


@pytest.fixture
def hardware_event_forwarder(decoy: Decoy) -> HardwareEventForwarder:
    """Get a mock HardwareListener."""
    return decoy.mock(cls=HardwareEventForwarder)


@pytest.fixture
def module_data_provider(decoy: Decoy) -> ModuleDataProvider:
    """Get a mock ModuleDataProvider."""
    return decoy.mock(cls=ModuleDataProvider)


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    model_utils: ModelUtils,
    hardware_stopper: HardwareStopper,
    hardware_event_forwarder: HardwareEventForwarder,
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
        hardware_event_forwarder=hardware_event_forwarder,
        module_data_provider=module_data_provider,
    )


def test_create_starts_background_tasks(
    decoy: Decoy,
    queue_worker: QueueWorker,
    hardware_event_forwarder: HardwareEventForwarder,
    subject: ProtocolEngine,
) -> None:
    """It should start the queue worker upon creation."""
    decoy.verify(queue_worker.start(), hardware_event_forwarder.start())


def test_add_command(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    queue_worker: QueueWorker,
    subject: ProtocolEngine,
) -> None:
    """It should add a command to the state from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    params = commands.HomeParams()
    request = commands.HomeCreate(params=params)
    queued = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        params=params,
    )

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)

    def _stub_queued(*_a: object, **_k: object) -> None:
        decoy.when(state_store.commands.get("command-id")).then_return(queued)

    decoy.when(
        action_dispatcher.dispatch(
            QueueCommandAction(
                command_id="command-id",
                command_key="command-id",
                created_at=created_at,
                request=request,
            )
        ),
    ).then_do(_stub_queued)

    result = subject.add_command(request)

    assert result == queued


async def test_add_and_execute_command(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    queue_worker: QueueWorker,
    subject: ProtocolEngine,
) -> None:
    """It should add and execute a command from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    params = commands.HomeParams()
    request = commands.HomeCreate(params=params)
    queued = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        params=params,
    )
    completed = commands.Home(
        id="command-id",
        key="command-key",
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=created_at,
        params=params,
    )

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)

    def _stub_queued(*_a: object, **_k: object) -> None:
        decoy.when(state_store.commands.get("command-id")).then_return(queued)

    def _stub_completed(*_a: object, **_k: object) -> bool:
        decoy.when(state_store.commands.get("command-id")).then_return(completed)
        return True

    decoy.when(
        action_dispatcher.dispatch(
            QueueCommandAction(
                command_id="command-id",
                command_key="command-id",
                created_at=created_at,
                request=request,
            )
        )
    ).then_do(_stub_queued)

    decoy.when(
        await state_store.wait_for(
            condition=state_store.commands.get_is_complete,
            command_id="command-id",
        ),
    ).then_do(_stub_completed)

    result = await subject.add_and_execute_command(request)

    assert result == completed


def test_play(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should be able to start executing queued commands."""
    subject.play()

    decoy.verify(
        state_store.commands.raise_if_paused_by_blocking_door(),
        state_store.commands.raise_if_stop_requested(),
        action_dispatcher.dispatch(PlayAction()),
    )


def test_pause(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should be able to pause executing queued commands."""
    expected_action = PauseAction(source=PauseSource.CLIENT)

    subject.pause()

    decoy.verify(
        state_store.commands.raise_if_stop_requested(),
        action_dispatcher.dispatch(expected_action),
    )


@pytest.mark.parametrize("drop_tips_and_home", [True, False])
async def test_finish(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    queue_worker: QueueWorker,
    hardware_api: HardwareControlAPI,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
    drop_tips_and_home: bool,
) -> None:
    """It should be able to gracefully tell the engine it's done."""
    await subject.finish(drop_tips_and_home=drop_tips_and_home)

    decoy.verify(
        action_dispatcher.dispatch(FinishAction()),
        await queue_worker.join(),
        await hardware_stopper.do_stop_and_recover(
            drop_tips_and_home=drop_tips_and_home
        ),
        action_dispatcher.dispatch(HardwareStoppedAction()),
        await plugin_starter.stop(),
    )


async def test_finish_with_error(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_api: HardwareControlAPI,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
) -> None:
    """It should be able to tell the engine it's finished because of an error."""
    error = RuntimeError("oh no")
    expected_error_details = FinishErrorDetails(
        error_id="error-id",
        created_at=datetime(year=2021, month=1, day=1),
        error=error,
    )

    decoy.when(model_utils.generate_id()).then_return("error-id")
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2021, month=1, day=1)
    )

    await subject.finish(error=error)

    decoy.verify(
        action_dispatcher.dispatch(FinishAction(error_details=expected_error_details)),
        await queue_worker.join(),
        await hardware_stopper.do_stop_and_recover(drop_tips_and_home=True),
        action_dispatcher.dispatch(HardwareStoppedAction()),
    )


async def test_finish_stops_hardware_if_queue_worker_join_fails(
    decoy: Decoy,
    queue_worker: QueueWorker,
    hardware_api: HardwareControlAPI,
    hardware_stopper: HardwareStopper,
    hardware_event_forwarder: HardwareEventForwarder,
    action_dispatcher: ActionDispatcher,
    plugin_starter: PluginStarter,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine."""
    decoy.when(
        await queue_worker.join(),
    ).then_raise(RuntimeError("oh no"))

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.finish()

    decoy.verify(
        hardware_event_forwarder.stop_soon(),
        await hardware_stopper.do_stop_and_recover(drop_tips_and_home=True),
        action_dispatcher.dispatch(HardwareStoppedAction()),
        await plugin_starter.stop(),
    )


async def test_wait_until_complete(
    decoy: Decoy,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine after waiting for commands to complete."""
    await subject.wait_until_complete()

    decoy.verify(
        await state_store.wait_for(condition=state_store.commands.get_all_complete)
    )


async def test_stop(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_api: HardwareControlAPI,
    subject: ProtocolEngine,
    hardware_stopper: HardwareStopper,
) -> None:
    """It should be able to stop the engine and halt the hardware."""
    await subject.stop()

    decoy.verify(
        action_dispatcher.dispatch(StopAction()),
        queue_worker.cancel(),
        await hardware_stopper.do_halt(),
    )


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

    id = "labware-offset-id"
    created_at = datetime(year=2021, month=11, day=15)

    expected_result = LabwareOffset(
        id=id,
        createdAt=created_at,
        definitionUri=request.definitionUri,
        location=request.location,
        vector=request.vector,
    )

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
                request=request,
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


async def test_use_attached_modules(
    decoy: Decoy,
    module_data_provider: ModuleDataProvider,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
    tempdeck_v1_def: ModuleDefinition,
    magdeck_v1_def: ModuleDefinition,
) -> None:
    """It should be able to load attached hardware modules directly into state."""
    mod_1 = decoy.mock(cls=TempDeck)
    mod_2 = decoy.mock(cls=MagDeck)

    decoy.when(mod_1.device_info).then_return({"serial": "serial-1"})
    decoy.when(mod_2.device_info).then_return({"serial": "serial-2"})
    decoy.when(mod_1.model()).then_return("temperatureModuleV1")
    decoy.when(mod_2.model()).then_return("magneticModuleV1")

    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V1)
    ).then_return(tempdeck_v1_def)

    decoy.when(
        module_data_provider.get_definition(ModuleModel.MAGNETIC_MODULE_V1)
    ).then_return(magdeck_v1_def)

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
            )
        ),
        action_dispatcher.dispatch(
            AddModuleAction(
                module_id="module-2",
                serial_number="serial-2",
                definition=magdeck_v1_def,
            ),
        ),
    )
