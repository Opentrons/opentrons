"""Test for Calibration Set Up Position Implementation."""
from decoy import Decoy
import pytest

from opentrons.protocol_engine.commands.calibration.move_to_location import (
    MoveToLocationParams,
    MoveToLocationImplementation,
    CalibrationPositions,
)
from opentrons.protocol_engine.execution import MovementHandler, SavedPositionData
from opentrons.protocol_engine.state import StateView
from opentrons.types import DeckSlotName, Point
from opentrons.protocol_engine.types import DeckPoint


@pytest.mark.parametrize(
    argnames=["slot_name"],
    argvalues=[
        [CalibrationPositions.PROBE_POSITION],
        [CalibrationPositions.ATTACH_OR_DETACH],
    ],
)
async def test_calibration_set_up_position_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    slot_name: CalibrationPositions,
) -> None:
    """Command should get a Point value for a given deck slot center and \
        call Movement.move_to_coordinates with the correct input."""
    probe_position = SavedPositionData(
        positionId="probe_position", position=DeckPoint(x=4, y=5, z=3)
    )
    attach_or_detach = SavedPositionData(
        positionId="attach_position",
        position=DeckPoint(x=1, y=2, z=10),
    )
    decoy.when(
        await movement.save_position(
            pipette_id="pipette-id", position_id="probePosition"
        )
    ).then_return(probe_position)
    decoy.when(
        await movement.save_position(
            pipette_id="pipette-id", position_id="attachOrDetach"
        )
    ).then_return(attach_or_detach)

    decoy.when(
        state_view.labware.get_slot_center_position(DeckSlotName.SLOT_2)
    ).then_return(Point(x=1, y=2, z=10))
    decoy.when(
        state_view.labware.get_slot_center_position(DeckSlotName.SLOT_5)
    ).then_return(Point(x=4, y=5, z=6))

    def movement_coordinate(slot: CalibrationPositions) -> SavedPositionData:
        if slot == CalibrationPositions.PROBE_POSITION:
            return probe_position
        else:
            return attach_or_detach

    params = MoveToLocationParams(
        pipetteId="pipette-id",
        deckSlot=slot_name,
    )
    subject = MoveToLocationImplementation(state_view=state_view, movement=movement)
    result = await subject.execute(params=params)
    assert result
    movement_result = DeckPoint(
        x=movement_coordinate(slot_name).position.x + slot_name.offset.x,
        y=movement_coordinate(slot_name).position.y + slot_name.offset.y,
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
