"""Test move to well commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import (
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckPoint,
    errors,
)
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.types import Point

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.move_to_well import (
    MoveToWellParams,
    MoveToWellResult,
    MoveToWellImplementation,
)
from opentrons.protocol_engine.state.state import StateView


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


async def test_move_to_well_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
) -> None:
    """A MoveToWell command should have an execution implementation."""
    subject = MoveToWellImplementation(state_view=state_view, movement=movement)

    data = MoveToWellParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        forceDirect=True,
        minimumZHeight=4.56,
        speed=7.89,
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
            force_direct=True,
            minimum_z_height=4.56,
            speed=7.89,
        )
    ).then_return(Point(x=9, y=8, z=7))

    result = await subject.execute(data)

    assert result == SuccessData(
        public=MoveToWellResult(position=DeckPoint(x=9, y=8, z=7)),
        private=None,
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="abc",
                new_location=update_types.Well(labware_id="123", well_name="A3"),
                new_deck_point=DeckPoint(x=9, y=8, z=7),
            )
        ),
    )


async def test_move_to_well_with_tip_rack_and_meniscus(
    decoy: Decoy,
    mock_state_view: StateView,
    movement: MovementHandler,
) -> None:
    """It should disallow movement to a tip rack when MENISCUS is specified."""
    subject = MoveToWellImplementation(state_view=mock_state_view, movement=movement)

    data = MoveToWellParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(
            origin=WellOrigin.MENISCUS, offset=WellOffset(x=1, y=2, z=3)
        ),
        forceDirect=True,
        minimumZHeight=4.56,
        speed=7.89,
    )

    decoy.when(mock_state_view.labware.is_tiprack("123")).then_return(True)

    with pytest.raises(errors.LabwareIsTipRackError):
        await subject.execute(data)


async def test_move_to_well_with_tip_rack_and_volume_offset(
    decoy: Decoy,
    mock_state_view: StateView,
    movement: MovementHandler,
) -> None:
    """It should disallow movement to a tip rack when volumeOffset is specified."""
    subject = MoveToWellImplementation(state_view=mock_state_view, movement=movement)

    data = MoveToWellParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3), volumeOffset=-40.0),
        forceDirect=True,
        minimumZHeight=4.56,
        speed=7.89,
    )

    decoy.when(mock_state_view.labware.is_tiprack("123")).then_return(True)

    with pytest.raises(errors.LabwareIsTipRackError):
        await subject.execute(data)
