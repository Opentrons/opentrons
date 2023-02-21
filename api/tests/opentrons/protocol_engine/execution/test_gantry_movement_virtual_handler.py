import pytest
from decoy import Decoy

from opentrons.types import Mount, Point
from opentrons.hardware_control.types import CriticalPoint

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.types import DeckPoint

from opentrons.protocol_engine.execution.gantry_movement import VirtualGantryMovementHandler


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(
    state_store: StateStore,
) -> VirtualGantryMovementHandler:
    """Create a GantryMovementHandler with its dependencies mocked out."""
    return VirtualGantryMovementHandler(
        state_store=state_store,
    )


async def test_get_position(
    decoy: Decoy,
    state_store: StateStore,
    subject: VirtualGantryMovementHandler,
) -> None:
    """It should get the position of the pipette with the state store."""
    decoy.when(state_store.pipettes.get_deck_point("pipette-id")).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.get_position("pipette-id", mount=Mount.LEFT)

    assert result == Point(x=1, y=2, z=3)


async def test_get_position_default(
    decoy: Decoy,
    state_store: StateStore,
    subject: VirtualGantryMovementHandler,
) -> None:
    """It should get a default Point if no stored deck point can be found in the state store."""
    decoy.when(state_store.pipettes.get_deck_point("pipette-id")).then_return(None)

    result = await subject.get_position("pipette-id", mount=Mount.LEFT)

    assert result == Point(x=0, y=0, z=0)


def test_get_max_travel_z(
    decoy: Decoy,
    state_store: StateStore,
    subject: VirtualGantryMovementHandler,
) -> None:
    """It should get the max travel z height with the state store."""
    decoy.when(state_store.pipettes.get_instrument_max_height("pipette-id")).then_return(42)
    decoy.when(state_store.tips.get_tip_length("pipette-id")).then_return(20)

    result = subject.get_max_travel_z("pipette-id", mount=Mount.RIGHT)

    assert result == 22.0


async def test_move_relative(
    decoy: Decoy,
    state_store: StateStore,
    subject: VirtualGantryMovementHandler,
) -> None:
    """It should simulate moving the gantry by the delta with the state store."""
    decoy.when(state_store.pipettes.get_deck_point("pipette-id")).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.move_relative("pipette-id", mount=Mount.LEFT, critical_point=CriticalPoint.TIP, delta=Point(3, 2, 1), speed=123)

    assert result == Point(x=4, y=4, z=4)
