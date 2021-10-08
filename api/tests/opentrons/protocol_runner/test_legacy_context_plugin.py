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
        legacy_context.labware_loaded_broker.subscribe(callback=matchers.Anything())
    ).then_return(labware_unsubscribe)

    decoy.when(
        legacy_context.instrument_loaded_broker.subscribe(callback=matchers.Anything())
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
) -> None:
    """It should map broker messages to ProtocolEngine commands."""
    subject.handle_action(pe_actions.PlayAction())

    handler_captor = matchers.Captor()
    decoy.verify(
        legacy_context.broker.subscribe(topic="command", handler=handler_captor)
    )

    handler: Callable[[LegacyCommand], None] = handler_captor.value

    legacy_command: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }
    engine_command = pe_commands.Custom(
        id="command-id",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=pe_commands.CustomData(message="hello world"),  # type: ignore[call-arg]
    )

    decoy.when(
        legacy_command_mapper.map_brokered_command(command=legacy_command)
    ).then_return([engine_command])

    handler(legacy_command)

    decoy.verify(
        action_dispatcher.dispatch(pe_actions.UpdateCommandAction(engine_command))
    )
