"""Test for Calibration Set Up Position Implementation."""
from decoy import Decoy
import pytest

from opentrons.protocol_engine.commands.calibration.move_to_location import (
    MoveToLocationParams,
    MoveToLocationImplementation,
    CalibrationPosition,
)
from opentrons.protocol_engine.execution import MovementHandler, SavedPositionData
from opentrons.protocol_engine.state import StateView
from opentrons.types import DeckSlotName, Point
from opentrons.protocol_engine.types import DeckPoint


@pytest.mark.parametrize(
    argnames=["slot_name"],
    argvalues=[
        [CalibrationPosition.PROBE_POSITION],
        [CalibrationPosition.ATTACH_OR_DETACH],
    ],
)
async def test_calibration_set_up_position_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    slot_name: CalibrationPosition,
) -> None:
    """Command should get a Point value for a given deck slot center and \
        call Movement.move_to_coordinates with the correct input."""

    def movement_coordinate(slot: CalibrationPosition) -> SavedPositionData:
        if slot == CalibrationPosition.PROBE_POSITION:
            return probe_position
        else:
            return attach_or_detach

    params = MoveToLocationParams(
        pipetteId="pipette-id",
        location=slot_name,
    )

    def offset(slot: CalibrationPosition) -> DeckPoint:
        if slot == CalibrationPosition.PROBE_POSITION:
            return DeckPoint(x=10, y=0, z=3)
        else:
            return DeckPoint(x=0, y=0, z=0)

    probe_position = SavedPositionData(
        position=DeckPoint(x=4, y=5, z=3),
        positionId="",
    )
    attach_or_detach = SavedPositionData(
        position=DeckPoint(x=1, y=2, z=10),
        positionId="",
    )
    decoy.when(
        await movement.save_position(pipette_id="pipette-id", position_id=None)
    ).then_return(
        probe_position
        if slot_name == CalibrationPosition.PROBE_POSITION
        else attach_or_detach
    )

    decoy.when(
        state_view.labware.get_slot_center_position(DeckSlotName.SLOT_2)
    ).then_return(Point(x=1, y=2, z=10))
    decoy.when(
        state_view.labware.get_slot_center_position(DeckSlotName.SLOT_5)
    ).then_return(Point(x=4, y=5, z=6))

    subject = MoveToLocationImplementation(state_view=state_view, movement=movement)
    result = await subject.execute(params=params)
    assert result
    movement_result = DeckPoint(
        x=movement_coordinate(slot_name).position.x + offset(slot_name).x,
        y=movement_coordinate(slot_name).position.y + offset(slot_name).y,
        z=movement_coordinate(slot_name).position.z,
    )

    decoy.verify(
        await movement.move_to_coordinates(
            pipette_id="pipette-id",
            deck_coordinates=movement_result,
            direct=True,
            additional_min_travel_z=None,
        )
    )
