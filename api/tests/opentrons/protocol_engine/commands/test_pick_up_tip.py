"""Test pick up tip commands."""
import pytest
from decoy import Decoy

from opentrons.types import MountType, Point

from opentrons.protocol_engine import WellLocation, WellOffset, DeckPoint
from opentrons.protocol_engine.types import TipGeometry
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.execution import MovementHandler, TipHandler

from opentrons.protocol_engine.commands.pick_up_tip import (
    PickUpTipParams,
    PickUpTipResult,
    PickUpTipImplementation,
)


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def mock_movement_handler(decoy: Decoy) -> MovementHandler:
    """Get a mock MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mock TipHandler."""
    return decoy.mock(cls=TipHandler)


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_movement_handler: MovementHandler,
    mock_tip_handler: TipHandler,
) -> None:
    """A PickUpTip command should have an execution implementation."""
    subject = PickUpTipImplementation(
        state_view=mock_state_view,
        movement=mock_movement_handler,
        tip_handler=mock_tip_handler,
    )

    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.LEFT
    )

    decoy.when(
        await mock_movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    ).then_return(Point(x=111, y=222, z=333))

    decoy.when(
        await mock_tip_handler.pick_up_tip(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
        )
    ).then_return(TipGeometry(length=42, diameter=5, volume=300))

    result = await subject.execute(
        PickUpTipParams(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="A3",
            wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    )

    assert result == PickUpTipResult(
        tipLength=42,
        tipVolume=300,
        tipDiameter=5,
        position=DeckPoint(x=111, y=222, z=333),
    )
