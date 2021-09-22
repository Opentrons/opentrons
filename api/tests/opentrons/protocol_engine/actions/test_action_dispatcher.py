"""Tests for the protocol engine's ActionDispatcher."""
from decoy import Decoy

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    ActionHandler,
    PlayAction,
)


def test_sink(decoy: Decoy) -> None:
    """It should send all actions to the sink handler."""
    action = PlayAction()

    sink = decoy.mock(cls=ActionHandler)
    subject = ActionDispatcher(sink=sink)

    subject.dispatch(action)

    decoy.verify(sink.handle_action(action))


def test_add_handler(decoy: Decoy) -> None:
    """It should actions to handlers before the sink."""
    action = PlayAction()

    handler_1 = decoy.mock(cls=ActionHandler)
    handler_2 = decoy.mock(cls=ActionHandler)
    sink = decoy.mock(cls=ActionHandler)

    subject = ActionDispatcher(sink=sink)
    subject.add_handler(handler_1)
    subject.add_handler(handler_2)
    subject.dispatch(action)

    decoy.verify(
        handler_1.handle_action(action),
        handler_2.handle_action(action),
        sink.handle_action(action),
    )
