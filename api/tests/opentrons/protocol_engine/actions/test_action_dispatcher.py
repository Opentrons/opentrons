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
