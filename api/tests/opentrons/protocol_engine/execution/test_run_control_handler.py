"""Run control side-effect handler."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.actions import ActionDispatcher, PauseAction
from opentrons.protocol_engine.execution.run_control import RunControlHandler
from opentrons.protocol_engine.state import EngineConfigs


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def subject(
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
) -> RunControlHandler:
    """Create a RunControlHandler with its dependencies mocked out."""
    return RunControlHandler(
        state_store=state_store,
        action_dispatcher=action_dispatcher,
    )


async def test_pause(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: RunControlHandler,
) -> None:
    """It should be able to execute a pause."""
    decoy.when(state_store.get_configs()).then_return(EngineConfigs(ignore_pause=False))
    await subject.pause()
    decoy.verify(
        action_dispatcher.dispatch(PauseAction()),
        await state_store.wait_for(condition=state_store.commands.get_is_running),
    )


async def test_pause_analysis(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: RunControlHandler,
) -> None:
    """It should no op during a protocol analysis."""
    decoy.when(state_store.get_configs()).then_return(EngineConfigs(ignore_pause=True))
    await subject.pause()
    decoy.verify(action_dispatcher.dispatch(PauseAction()), times=0)
