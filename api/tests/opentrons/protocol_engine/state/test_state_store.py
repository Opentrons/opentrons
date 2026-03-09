"""Tests for the top-level StateStore/StateView."""

from datetime import datetime
from typing import Any, Callable, Union

import pytest
from decoy import Decoy

from opentrons_shared_data.deck.types import DeckDefinitionV5

from opentrons.protocol_engine.actions import PlayAction
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.state import State, StateStore
from opentrons.protocol_engine.types import DeckType
from opentrons.util.change_notifier import ChangeNotifier


@pytest.fixture
def change_notifier(decoy: Decoy) -> ChangeNotifier:
    """Get a mocked out ChangeNotifier."""
    return decoy.mock(cls=ChangeNotifier)


@pytest.fixture
def engine_config() -> Config:
    """Get a ProtocolEngine config value object."""
    return Config(
        # Choice of robot and deck type is arbitrary.
        robot_type="OT-2 Standard",
        deck_type=DeckType.OT2_STANDARD,
    )


@pytest.fixture
def subject(
    change_notifier: ChangeNotifier,
    ot2_standard_deck_def: DeckDefinitionV5,
    engine_config: Config,
) -> StateStore:
    """Get a StateStore test subject."""

    def placeholder_error_recovery_policy(*args: object, **kwargs: object) -> Any:
        raise NotImplementedError()

    return StateStore(
        config=engine_config,
        deck_definition=ot2_standard_deck_def,
        robot_definition={
            "displayName": "OT-2",
            "robotType": "OT-2 Standard",
            "models": ["OT-2 Standard", "OT-2 Refresh"],
            "extents": [446.75, 347.5, 0.0],
            "paddingOffsets": {
                "rear": -35.91,
                "front": 31.89,
                "leftSide": 0,
                "rightSide": 0,
            },
            "mountOffsets": {"left": [-34.0, 0.0, 0.0], "right": [0.0, 0.0, 0.0]},
        },
        deck_fixed_labware=[],
        change_notifier=change_notifier,
        is_door_open=False,
        error_recovery_policy=placeholder_error_recovery_policy,
    )


def test_has_state(subject: StateStore) -> None:
    """It should have an initial state."""
    result = subject.state

    assert isinstance(result, State)


def test_state_is_immutable(subject: StateStore) -> None:
    """It should treat the state as immutable."""
    result_1 = subject.state
    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    result_2 = subject.state

    assert result_1 is not result_2


def test_notify_on_state_change(
    decoy: Decoy,
    change_notifier: ChangeNotifier,
    subject: StateStore,
) -> None:
    """It should notify state changes when actions are handled."""
    decoy.verify(change_notifier.notify(), times=0)
    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    decoy.verify(change_notifier.notify(), times=1)


async def test_wait_for(
    decoy: Decoy,
    change_notifier: ChangeNotifier,
    subject: StateStore,
) -> None:
    """It should return an awaitable that signals state changes."""
    check_condition: Callable[..., Union[str, int]] = decoy.mock(name="check_condition")

    decoy.when(check_condition("foo", bar="baz")).then_return(
        0,
        0,
        "hello world",
    )
    result = await subject.wait_for(check_condition, "foo", bar="baz")
    assert result == "hello world"
    decoy.verify(await change_notifier.wait(), times=2)

    decoy.reset()

    decoy.when(check_condition("foo", bar="baz")).then_return(
        "hello world",
        "hello world again",
        0,
    )
    result = await subject.wait_for_not(check_condition, "foo", bar="baz")
    assert result == 0
    decoy.verify(await change_notifier.wait(), times=2)


async def test_wait_for_already_satisfied(
    decoy: Decoy,
    subject: StateStore,
    change_notifier: ChangeNotifier,
) -> None:
    """It should return immediately and skip the change notifier."""
    check_condition: Callable[..., Union[str, int]] = decoy.mock(name="check_condition")

    decoy.when(check_condition("foo", bar="baz")).then_return("hello world")
    result = await subject.wait_for(check_condition, "foo", bar="baz")
    assert result == "hello world"
    decoy.verify(await change_notifier.wait(), times=0)

    decoy.when(check_condition("foo", bar="baz")).then_return(0)
    result = await subject.wait_for_not(check_condition, "foo", bar="baz")
    assert result == 0
    decoy.verify(await change_notifier.wait(), times=0)


async def test_wait_for_raises(decoy: Decoy, subject: StateStore) -> None:
    """It should raise if the condition function raises."""
    check_condition = decoy.mock(name="check_condition")

    decoy.when(check_condition()).then_raise(ValueError("oh no"))

    with pytest.raises(ValueError, match="oh no"):
        await subject.wait_for(check_condition)

    with pytest.raises(ValueError, match="oh no"):
        await subject.wait_for_not(check_condition)
