"""Tests for ProtocolEngine plugins."""
import pytest
from decoy import Decoy
from datetime import datetime

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.plugins import AbstractPlugin, PluginStarter
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
    decoy: Decoy, state_view: StateView, action_dispatcher: ActionDispatcher
) -> None:
    """The engine should be able to configure the plugin."""
    action = PlayAction(
        requested_at=datetime(year=2021, month=1, day=1), deck_configuration=[]
    )

    subject = _MyPlugin()
    subject._configure(
        state=state_view,
        action_dispatcher=action_dispatcher,
    )

    subject.dispatch(action)

    assert subject.state == state_view
    decoy.verify(action_dispatcher.dispatch(action))


async def test_setup_teardown(
    decoy: Decoy,
    state_view: StateView,
    action_dispatcher: ActionDispatcher,
) -> None:
    """The PluginStarter should setup and teardown plugins."""
    plugin_1 = decoy.mock(cls=AbstractPlugin)
    plugin_2 = decoy.mock(cls=AbstractPlugin)

    subject = PluginStarter(state=state_view, action_dispatcher=action_dispatcher)

    subject.start(plugin_1)
    decoy.verify(
        plugin_1._configure(state=state_view, action_dispatcher=action_dispatcher),
        action_dispatcher.add_handler(plugin_1),
        plugin_1.setup(),
    )

    subject.start(plugin_2)
    decoy.verify(
        plugin_2._configure(state=state_view, action_dispatcher=action_dispatcher),
        action_dispatcher.add_handler(plugin_2),
        plugin_2.setup(),
    )

    await subject.stop()
    decoy.verify(
        await plugin_1.teardown(),
        await plugin_2.teardown(),
    )
