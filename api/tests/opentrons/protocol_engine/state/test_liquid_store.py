"""Liquid state store tests."""
import pytest

from opentrons.protocol_engine.state.liquids import LiquidStore
from opentrons.protocol_engine.commands.load_liquid import Liquid
from opentrons.protocol_engine.actions.actions import AddLiquidAction


@pytest.fixture
def subject() -> LiquidStore:
    """Liquid store test subject."""
    return LiquidStore()


def test_handles_add_liquid(subject: LiquidStore) -> None:
    """It should add the liquid to the state."""
    expected_liquid = Liquid(
        id="water-id", displayName="water", description="water-desc"
    )
    subject.handle_action(AddLiquidAction(liquid=expected_liquid))

    assert subject.state.liquids[0] == expected_liquid
