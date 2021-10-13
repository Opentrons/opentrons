"""Tests for the ProtocolRunner's LegacyContextPlugin."""
import pytest
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
    """It should subscribe to the brokers on play and unsubscribe on stop."""
    main_unsubscribe: Callable[[], None] = decoy.mock()
    labware_unsubscribe: Callable[[], None] = decoy.mock()
    instrument_unsubscribe: Callable[[], None] = decoy.mock()

    decoy.when(
        legacy_context.broker.subscribe(
            topic="command",
            handler=matchers.Anything(),
        )
    ).then_return(main_unsubscribe)

    decoy.when(
        legacy_context.labware_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(labware_unsubscribe)

    decoy.when(
        legacy_context.instrument_load_broker.subscribe(callback=matchers.Anything())
    ).then_return(instrument_unsubscribe)

    subject.handle_action(pe_actions.PlayAction())
    subject.handle_action(pe_actions.StopAction())

    decoy.verify(main_unsubscribe())
    decoy.verify(labware_unsubscribe())
    decoy.verify(instrument_unsubscribe())


def test_broker_messages(
    decoy: Decoy,
    legacy_context: LegacyProtocolContext,
    legacy_command_mapper: LegacyCommandMapper,
    action_dispatcher: pe_actions.ActionDispatcher,
    subject: LegacyContextPlugin,
    minimal_labware_def: LabwareDefinitionDict,
) -> None:
    """It should map broker messages to ProtocolEngine commands."""
    subject.handle_action(pe_actions.PlayAction())

    main_handler_captor = matchers.Captor()
    load_labware_handler_captor = matchers.Captor()
    load_instrument_handler_captor = matchers.Captor()

    decoy.verify(
        legacy_context.broker.subscribe(topic="command", handler=main_handler_captor)
    )
    decoy.verify(
        legacy_context.labware_load_broker.subscribe(
            callback=load_labware_handler_captor
        )
    )
    decoy.verify(
        legacy_context.instrument_load_broker.subscribe(
            callback=load_instrument_handler_captor
        )
    )

    main_handler: Callable[[LegacyCommand], None] = main_handler_captor.value
    load_labware_handler: Callable[
        [LegacyLabwareLoadInfo], None
    ] = load_labware_handler_captor.value
    load_instrument_handler: Callable[
        [LegacyInstrumentLoadInfo], None
    ] = load_instrument_handler_captor.value

    input_main_broker_command: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }
    input_load_labware_info = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
    )
    input_load_instrument_info = LegacyInstrumentLoadInfo(
        instrument_load_name="some_load_name", mount=Mount.LEFT
    )

    dummy_main_command = pe_commands.Custom(
        id="command-id-1",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=pe_commands.CustomData(message="hello world"),  # type: ignore[call-arg]
    )
    dummy_labware_command = pe_commands.Custom(
        id="command-id-2",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=pe_commands.CustomData(message="hello world"),  # type: ignore[call-arg]
    )
    dummy_instrument_command = pe_commands.Custom(
        id="command-id-3",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=pe_commands.CustomData(message="hello world"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_command(command=input_main_broker_command)
    ).then_return(dummy_main_command)
    decoy.when(
        legacy_command_mapper.map_labware_load(
            labware_load_info=input_load_labware_info
        )
    ).then_return(dummy_labware_command)
    decoy.when(
        legacy_command_mapper.map_instrument_load(
            instrument_load_info=input_load_instrument_info
        )
    ).then_return(dummy_instrument_command)

    main_handler(input_main_broker_command)
    load_labware_handler(input_load_labware_info)
    load_instrument_handler(input_load_instrument_info)

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(dummy_main_command))
    )
    decoy.verify(
        action_dispatcher.dispatch(
            pe_actions.UpdateCommandAction(dummy_labware_command)
        )
    )
    decoy.verify(
        action_dispatcher.dispatch(
            pe_actions.UpdateCommandAction(dummy_instrument_command)
        )
    )
