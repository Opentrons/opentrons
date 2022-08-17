"""Liquid view tests."""
import pytest

from opentrons.protocol_engine.state.liquids import LiquidState, LiquidView
from opentrons.protocol_engine import Liquid


@pytest.fixture
def subject() -> LiquidView:
    """Get a liquid view test subject."""
    state = LiquidState(
        liquids_by_id={
            "water-id": Liquid(
                id="water-id", displayName="water", description="water desc"
            )
        }
    )

    return LiquidView(state)


def test_get_all(subject: LiquidView) -> None:
    """Should return a list of liquids."""
    assert subject.get_all() == [
        Liquid(id="water-id", displayName="water", description="water desc")
    ]


def test_has_liquid(subject: LiquidView) -> None:
    """Should return true if an item exists in the liquids list."""
    assert subject.has("water-id") is True

    assert subject.has("no-id") is False
