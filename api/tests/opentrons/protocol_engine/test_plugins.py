"""Tests for ProtocolEngine plugins."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.plugins import AbstractPlugin
from opentrons.protocol_engine.actions import ActionDispatcher, Action, PlayAction


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mock ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


class _MyPlugin(AbstractPlugin):
    def handle_action(self, action: Action) -> None:
        pass


def test_configure(
    decoy: Decoy,
    state_view: StateView,
    action_dispatcher: ActionDispatcher,
) -> None:
    """The engine should be able to configure the plugin."""
    action = PlayAction()

    subject = _MyPlugin()._configure(
        state=state_view,
        action_dispatcher=action_dispatcher,
    )

    subject.dispatch(action)

    assert subject.state == state_view
    decoy.verify(action_dispatcher.dispatch(action))
