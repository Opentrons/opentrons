"""Tests for the ProtocolRunner's LegacyContextPlugin."""
import pytest
from anyio import to_thread
from decoy import Decoy, matchers
from datetime import datetime
from typing import Callable

from opentrons.commands.types import CommandMessage as LegacyCommand, PauseMessage
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import (
    PauseType,
    DoorStateNotification,
    DoorState,
)
from opentrons.protocol_engine import (
    StateView,
    actions as pe_actions,
    commands as pe_commands,
)

from opentrons.protocol_runner.legacy_command_mapper import LegacyCommandMapper
from opentrons.protocol_runner.legacy_context_plugin import LegacyContextPlugin
from opentrons.protocol_runner.legacy_wrappers import (
    LegacyProtocolContext,
    LegacyLabwareLoadInfo,
    LegacyInstrumentLoadInfo,
    LegacyModuleLoadInfo,
    LegacyMagneticModuleModel,
)

from opentrons.types import DeckSlotName, Mount

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LabwareDefinitionDict,
)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI dependency."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def legacy_context(decoy: Decoy) -> LegacyProtocolContext:
    """Get a mocked out LegacyProtocolContext dependency."""
    return decoy.mock(cls=LegacyProtocolContext)


@pytest.fixture
def legacy_command_mapper(decoy: Decoy) -> LegacyCommandMapper:
    """Get a mocked out LegacyCommandMapper dependency."""
    return decoy.mock(cls=LegacyCommandMapper)


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> pe_actions.ActionDispatcher:
    """Get a mock ActionDispatcher."""
    return decoy.mock(cls=pe_actions.ActionDispatcher)


@pytest.fixture
def subject(
    hardware_api: HardwareAPI,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    state_view: StateView,
    action_dispatcher: pe_actions.ActionDispatcher,
) -> LegacyContextPlugin:
    """Get a configured LegacyContextPlugin with its dependencies mocked out."""
    plugin = LegacyContextPlugin(
        hardware_api=hardware_api,
        protocol_context=legacy_context,
        legacy_command_mapper=legacy_command_mapper,
    )
    plugin._configure(state=state_view, action_dispatcher=action_dispatcher)
    return plugin


def test_play_action(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: LegacyContextPlugin,
) -> None:
    """It should resume the hardware controller upon a play action."""
    action = pe_actions.PlayAction()
    subject.handle_action(action)

    decoy.verify(hardware_api.resume(PauseType.PAUSE))


def test_play_pauses_when_door_is_open(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    subject: LegacyContextPlugin,
) -> None:
    """It should not play the hardware controller when door is blocking."""
    action = pe_actions.PlayAction()

    decoy.when(state_view.commands.get_is_door_blocking()).then_return(True)
    subject.handle_action(action)

    decoy.verify(hardware_api.pause(PauseType.PAUSE))


def test_pause_action(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: LegacyContextPlugin,
) -> None:
    """It should pause the hardware controller upon a pause action."""
    subject.handle_action(
        pe_actions.PauseAction(source=pe_actions.PauseSource.PROTOCOL)
    )
    decoy.verify(hardware_api.pause(PauseType.PAUSE), times=0)

    subject.handle_action(pe_actions.PauseAction(source=pe_actions.PauseSource.CLIENT))
    decoy.verify(hardware_api.pause(PauseType.PAUSE), times=1)


def test_hardware_event_action(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    subject: LegacyContextPlugin,
) -> None:
    """It should pause the hardware controller upon a blocking HardwareEventAction."""
    door_open_event = DoorStateNotification(new_state=DoorState.OPEN, blocking=True)
    decoy.when(state_view.commands.get_is_implicitly_active()).then_return(True)
    subject.handle_action(pe_actions.HardwareEventAction(event=door_open_event))
    # Should not pause when engine queue is implicitly active
    decoy.verify(hardware_api.pause(PauseType.PAUSE), times=0)

    decoy.when(state_view.commands.get_is_implicitly_active()).then_return(False)
    subject.handle_action(pe_actions.HardwareEventAction(event=door_open_event))
    # Should pause
    decoy.verify(hardware_api.pause(PauseType.PAUSE), times=1)


async def test_broker_subscribe_unsubscribe(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    subject: LegacyContextPlugin,
) -> None:
    """It should subscribe to the brokers on setup and unsubscribe on teardown."""
    main_unsubscribe: Callable[[], None] = decoy.mock()
    labware_unsubscribe: Callable[[], None] = decoy.mock()
    instrument_unsubscribe: Callable[[], None] = decoy.mock()
    module_unsubscribe: Callable[[], None] = decoy.mock()

    decoy.when(
        legacy_context.broker.subscribe(topic="command", handler=matchers.Anything())
    ).then_return(main_unsubscribe)

    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(labware_unsubscribe)

    decoy.when(
        legacy_context.instrument_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(instrument_unsubscribe)

    decoy.when(
        legacy_context.module_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(module_unsubscribe)

    subject.setup()
    await subject.teardown()

    decoy.verify(main_unsubscribe())
    decoy.verify(labware_unsubscribe())
    decoy.verify(instrument_unsubscribe())
    decoy.verify(module_unsubscribe())


async def test_main_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
) -> None:
    """It should dispatch commands from main broker messages."""
    # Capture the function that the plugin sets up as its command broker callback.
    # Also, ensure that all subscribe calls return an actual unsubscribe callable
    # (instead of Decoy's default `None`) so subject.teardown() works.
    command_handler_captor = matchers.Captor()
    decoy.when(
        legacy_context.broker.subscribe(topic="command", handler=command_handler_captor)
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.instrument_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.module_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())

    subject.setup()

    handler: Callable[[LegacyCommand], None] = command_handler_captor.value

    legacy_command: PauseMessage = {
        "$": "before",
        "id": "message-id",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello", "text": "hello"},
        "error": None,
    }
    engine_command = pe_commands.Custom(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(legacy_command_mapper.map_command(command=legacy_command)).then_return(
        [pe_actions.UpdateCommandAction(engine_command)]
    )

    await to_thread.run_sync(handler, legacy_command)

    await subject.teardown()

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )


async def test_labware_load_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
    minimal_labware_def: LabwareDefinitionDict,
) -> None:
    """It should dispatch commands from labware load broker messages."""
    # Capture the function that the plugin sets up as its labware load callback.
    # Also, ensure that all subscribe calls return an actual unsubscribe callable
    # (instead of Decoy's default `None`) so subject.teardown() works.
    labware_handler_captor = matchers.Captor()
    decoy.when(
        legacy_context.broker.subscribe(topic="command", handler=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=labware_handler_captor)
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.instrument_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.module_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())

    subject.setup()

    handler: Callable[[LegacyLabwareLoadInfo], None] = labware_handler_captor.value

    labware_load_info = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_display_name=None,
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
        on_module=False,
        offset_id=None,
    )

    engine_command = pe_commands.Custom(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_labware_load(labware_load_info=labware_load_info)
    ).then_return(engine_command)

    await to_thread.run_sync(handler, labware_load_info)

    await subject.teardown()

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )


async def test_instrument_load_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
) -> None:
    """It should dispatch commands from instrument load broker messages."""
    # Capture the function that the plugin sets up as its labware load callback.
    # Also, ensure that all subscribe calls return an actual unsubscribe callable
    # (instead of Decoy's default `None`) so subject.teardown() works.
    instrument_handler_captor = matchers.Captor()
    decoy.when(
        legacy_context.broker.subscribe(topic="command", handler=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.instrument_load_broker.subscribe(
            callback=instrument_handler_captor
        )
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.module_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())

    subject.setup()

    handler: Callable[
        [LegacyInstrumentLoadInfo], None
    ] = instrument_handler_captor.value

    instrument_load_info = LegacyInstrumentLoadInfo(
        instrument_load_name="some_load_name", mount=Mount.LEFT
    )

    engine_command = pe_commands.Custom(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_instrument_load(
            instrument_load_info=instrument_load_info
        )
    ).then_return(engine_command)

    await to_thread.run_sync(handler, instrument_load_info)

    await subject.teardown()

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )


async def test_module_load_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
) -> None:
    """It should dispatch commands from module load broker messages."""
    # Capture the function that the plugin sets up as its module load callback.
    # Also, ensure that all subscribe calls return an actual unsubscribe callable
    # (instead of Decoy's default `None`) so subject.teardown() works.
    module_handler_captor = matchers.Captor()
    decoy.when(
        legacy_context.broker.subscribe(topic="command", handler=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.instrument_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(decoy.mock())
    decoy.when(
        legacy_context.module_load_broker.subscribe(callback=module_handler_captor)
    ).then_return(decoy.mock())

    subject.setup()

    handler: Callable[[LegacyModuleLoadInfo], None] = module_handler_captor.value

    module_load_info = LegacyModuleLoadInfo(
        requested_model=LegacyMagneticModuleModel.MAGNETIC_V2,
        loaded_model=LegacyMagneticModuleModel.MAGNETIC_V2,
        deck_slot=DeckSlotName.SLOT_1,
        configuration=None,
        module_serial="serial-number",
    )
    engine_command = pe_commands.Custom(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_module_load(module_load_info=module_load_info)
    ).then_return(engine_command)

    await to_thread.run_sync(handler, module_load_info)

    await subject.teardown()

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )
