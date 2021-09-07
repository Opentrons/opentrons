"""Run control side-effect handler."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateStore, PauseAction
from opentrons.protocol_engine.execution.run_control import RunControlHandler


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(state_store: StateStore) -> RunControlHandler:
    """Create a RunControlHandler with its dependencies mocked out."""
    return RunControlHandler(state_store=state_store)


async def test_pause(
    decoy: Decoy, state_store: StateStore, subject: RunControlHandler
) -> None:
    """It should be able to execute a pause."""
    await subject.pause()

    decoy.verify(
        state_store.handle_action(PauseAction()),
        await state_store.wait_for(condition=state_store.commands.get_is_running),
    )
