"""Tests for the top-level StateStore."""
import asyncio
import pytest
from decoy import Decoy
from typing import Callable

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocol_engine.state import StateStore, State, PlayAction, PauseAction


@pytest.fixture
def subject(standard_deck_def: DeckDefinitionV2) -> StateStore:
    """Get a StateStore test subject."""
    return StateStore(
        deck_definition=standard_deck_def,
        deck_fixed_labware=[],
    )


def test_has_state(subject: StateStore) -> None:
    """It should have an initial state."""
    result = subject.get_state()

    assert isinstance(result, State)


def test_state_is_immutable(subject: StateStore) -> None:
    """It should treat the state as immutable."""
    result_1 = subject.get_state()
    subject.handle_action(PlayAction())
    result_2 = subject.get_state()

    assert result_1 is not result_2


async def test_wait_for_state(decoy: Decoy, subject: StateStore) -> None:
    """It should return an awaitable that signals state changes."""
    check_condition: Callable[..., bool] = decoy.mock()

    decoy.when(check_condition("foo", bar="baz")).then_return(
        False,
        False,
        True,
    )

    result = asyncio.create_task(subject.wait_for(check_condition, "foo", bar="baz"))
    await asyncio.sleep(0)

    subject.handle_action(PauseAction())
    await asyncio.sleep(0)
    assert result.done() is False

    subject.handle_action(PlayAction())
    await asyncio.sleep(0)
    assert result.done() is True


async def test_wait_for_already_true(decoy: Decoy, subject: StateStore) -> None:
    """It should signal immediately if condition is already met."""
    check_condition = decoy.mock()
    decoy.when(check_condition()).then_return(True)
    await subject.wait_for(check_condition)


async def test_wait_for_raises(decoy: Decoy, subject: StateStore) -> None:
    """It should raise if the condition function raises."""
    check_condition = decoy.mock()

    decoy.when(check_condition()).then_raise(ValueError("oh no"))

    with pytest.raises(ValueError, match="oh no"):
        await subject.wait_for(check_condition)
