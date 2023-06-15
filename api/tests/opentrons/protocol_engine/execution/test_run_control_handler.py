"""Run control side-effect handler."""
from time import monotonic as time_monotonic

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.actions import ActionDispatcher, PauseAction, PauseSource
from opentrons.protocol_engine.execution.run_control import RunControlHandler
from opentrons.protocol_engine.state import Config, StateStore
from opentrons.protocol_engine.types import DeckType


def _make_config(ignore_pause: bool) -> Config:
    return Config(
        ignore_pause=ignore_pause,
        # Robot and deck type are arbitrary.
        robot_type="OT-2 Standard",
        deck_type=DeckType.OT2_STANDARD,
    )


@pytest.fixture
def mock_state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def mock_action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def subject(
    mock_state_store: StateStore,
    mock_action_dispatcher: ActionDispatcher,
) -> RunControlHandler:
    """Create a RunControlHandler with its dependencies mocked out."""
    return RunControlHandler(
        state_store=mock_state_store,
        action_dispatcher=mock_action_dispatcher,
    )


async def test_pause(
    decoy: Decoy,
    mock_state_store: StateStore,
    mock_action_dispatcher: ActionDispatcher,
    subject: RunControlHandler,
) -> None:
    """It should be able to execute a pause."""
    decoy.when(mock_state_store.config).then_return(_make_config(ignore_pause=False))
    await subject.wait_for_resume()
    decoy.verify(
        mock_action_dispatcher.dispatch(PauseAction(source=PauseSource.PROTOCOL)),
        await mock_state_store.wait_for(
            condition=mock_state_store.commands.get_is_running
        ),
    )


async def test_pause_analysis(
    decoy: Decoy,
    mock_state_store: StateStore,
    mock_action_dispatcher: ActionDispatcher,
    subject: RunControlHandler,
) -> None:
    """It should no op during a protocol analysis."""
    decoy.when(mock_state_store.config).then_return(_make_config(ignore_pause=True))
    await subject.wait_for_resume()
    decoy.verify(
        mock_action_dispatcher.dispatch(PauseAction(source=matchers.Anything())),
        times=0,
    )


async def test_wait_for_duration(
    decoy: Decoy,
    mock_state_store: StateStore,
    subject: RunControlHandler,
) -> None:
    """It should wait for a specified duration.

    This test mixes mocks and actual functionality.
    An implementation that is "more testabe" probably involves
    re-implementing `asyncio.sleep`, which just isn't worth it.
    """
    decoy.when(mock_state_store.config).then_return(_make_config(ignore_pause=False))
    start = time_monotonic()
    await subject.wait_for_duration(seconds=0.2)
    end = time_monotonic()

    # NOTE: margin of error selected empirically
    # this is flakey test risk in CI
    assert end - start >= 0.1


async def test_wait_for_duration_ignore_pause(
    decoy: Decoy,
    mock_state_store: StateStore,
    subject: RunControlHandler,
) -> None:
    """It should wait for a specified duration.

    This test mixes mocks and actual functionality.
    An implementation that is "more testabe" probably involves
    re-implementing `asyncio.sleep`, which just isn't worth it.
    """
    decoy.when(mock_state_store.config).then_return(_make_config(ignore_pause=True))
    start = time_monotonic()
    # This wait time would be disruptively long for the test suite,
    # but it only matters when the subject has a bug and this test fails,
    # which should be rare.
    await subject.wait_for_duration(seconds=1.0)
    end = time_monotonic()

    # NOTE: margin of error selected empirically
    # this is flakey test risk in CI
    assert end - start <= 0.1
