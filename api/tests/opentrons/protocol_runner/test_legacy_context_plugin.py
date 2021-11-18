"""Tests for the ProtocolRunner's LegacyContextPlugin."""
import pytest
from anyio import to_thread
from decoy import Decoy, matchers
from datetime import datetime
from typing import Callable

from opentrons.commands.types import CommandMessage as LegacyCommand, PauseMessage
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import PauseType
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


def test_pause_action(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: LegacyContextPlugin,
) -> None:
    """It should pause the hardware controller upon a pause action."""
    action = pe_actions.PauseAction()
    subject.handle_action(action)

    decoy.verify(hardware_api.pause(PauseType.PAUSE))


def test_broker_subscribe_unsubscribe(
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
    subject.teardown()

    decoy.verify(
        main_unsubscribe(),
        labware_unsubscribe(),
        instrument_unsubscribe(),
        module_unsubscribe(),
    )


async def test_main_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
) -> None:
    """It should dispatch commands from main broker messages."""
    subject.setup()
    subject.handle_action(pe_actions.PlayAction())

    handler_captor = matchers.Captor()
    decoy.verify(
        legacy_context.broker.subscribe(topic="command", handler=handler_captor)
    )

    handler: Callable[[LegacyCommand], None] = handler_captor.value

    legacy_command: PauseMessage = {
        "$": "before",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello", "text": "hello"},
        "error": None,
    }
    engine_command = pe_commands.Custom(
        id="command-id",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(legacy_command_mapper.map_command(command=legacy_command)).then_return(
        pe_actions.UpdateCommandAction(engine_command)
    )

    await to_thread.run_sync(handler, legacy_command)

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
    subject.setup()
    subject.handle_action(pe_actions.PlayAction())

    handler_captor = matchers.Captor()

    decoy.verify(legacy_context.labware_load_broker.subscribe(callback=handler_captor))

    handler: Callable[[LegacyLabwareLoadInfo], None] = handler_captor.value

    labware_load_info = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
        on_module=False,
        pe_labware_offset_id=None,
    )

    engine_command = pe_commands.Custom(
        id="command-id",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_labware_load(labware_load_info=labware_load_info)
    ).then_return(engine_command)

    await to_thread.run_sync(handler, labware_load_info)

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
    subject.setup()
    subject.handle_action(pe_actions.PlayAction())

    handler_captor = matchers.Captor()

    decoy.verify(
        legacy_context.instrument_load_broker.subscribe(callback=handler_captor)
    )

    handler: Callable[[LegacyInstrumentLoadInfo], None] = handler_captor.value

    instrument_load_info = LegacyInstrumentLoadInfo(
        instrument_load_name="some_load_name", mount=Mount.LEFT
    )

    engine_command = pe_commands.Custom(
        id="command-id",
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
    subject.setup()
    subject.handle_action(pe_actions.PlayAction())

    handler_captor = matchers.Captor()

    decoy.verify(legacy_context.module_load_broker.subscribe(callback=handler_captor))

    handler: Callable[[LegacyModuleLoadInfo], None] = handler_captor.value

    module_load_info = LegacyModuleLoadInfo(
        module_name="some_module_name",
        deck_slot=DeckSlotName.SLOT_1,
        configuration=None,
    )
    engine_command = pe_commands.Custom(
        id="command-id",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        params=pe_commands.CustomParams(message="hello"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_module_load(module_load_info=module_load_info)
    ).then_return(engine_command)

    await to_thread.run_sync(handler, module_load_info)

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )
