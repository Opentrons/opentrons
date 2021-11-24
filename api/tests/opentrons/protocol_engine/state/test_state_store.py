"""Tests for the top-level StateStore/StateView."""
from typing import Callable, Optional

import pytest
from decoy import Decoy

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocol_engine.state import State, StateStore
from opentrons.protocol_engine.actions import PlayAction
from opentrons.protocol_engine.state.change_notifier import ChangeNotifier


@pytest.fixture
def change_notifier(decoy: Decoy) -> ChangeNotifier:
    """Get a mocked out ChangeNotifier."""
    return decoy.mock(cls=ChangeNotifier)


@pytest.fixture
def subject(
    change_notifier: ChangeNotifier, standard_deck_def: DeckDefinitionV2
) -> StateStore:
    """Get a StateStore test subject."""
    return StateStore(
        deck_definition=standard_deck_def,
        deck_fixed_labware=[],
        change_notifier=change_notifier,
    )


def test_has_state(subject: StateStore) -> None:
    """It should have an initial state."""
    result = subject.state

    assert isinstance(result, State)


def test_state_is_immutable(subject: StateStore) -> None:
    """It should treat the state as immutable."""
    result_1 = subject.state
    subject.handle_action(PlayAction())
    result_2 = subject.state

    assert result_1 is not result_2


def test_notify_on_state_change(
    decoy: Decoy,
    change_notifier: ChangeNotifier,
    subject: StateStore,
) -> None:
    """It should notify state changes when actions are handled."""
    decoy.verify(change_notifier.notify(), times=0)
    subject.handle_action(PlayAction())
    decoy.verify(change_notifier.notify(), times=1)


async def test_wait_for_state(
    decoy: Decoy,
    change_notifier: ChangeNotifier,
    subject: StateStore,
) -> None:
    """It should return an awaitable that signals state changes."""
    check_condition: Callable[..., Optional[str]] = decoy.mock()

    decoy.when(check_condition("foo", bar="baz")).then_return(
        None,
        None,
        "hello world",
    )

    result = await subject.wait_for(check_condition, "foo", bar="baz")
    assert result == "hello world"

    decoy.verify(await change_notifier.wait(), times=2)


async def test_wait_for_state_short_circuit(
    decoy: Decoy,
    subject: StateStore,
    change_notifier: ChangeNotifier,
) -> None:
    """It should short-circuit the change notifier if condition is satisfied."""
    check_condition: Callable[..., Optional[str]] = decoy.mock()

    decoy.when(check_condition("foo", bar="baz")).then_return("hello world")

    result = await subject.wait_for(check_condition, "foo", bar="baz")
    assert result == "hello world"

    decoy.verify(await change_notifier.wait(), times=0)


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
