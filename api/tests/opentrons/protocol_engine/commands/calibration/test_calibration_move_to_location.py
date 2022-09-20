"""Test for Calibration Set Up Position Implementation."""
from decoy import Decoy
import pytest
import mock

from opentrons.protocol_engine.commands.calibration.move_to_location import (
    MoveToLocationParams,
    MoveToLocationImplementation,
    MoveToLocationResult,
<<<<<<< HEAD
    CalibrationPositions,
)
from opentrons.protocol_engine.execution import MovementHandler, SavedPositionData
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import DeckSlotName, Point


probe_position = SavedPositionData(
    positionId="probe_position", position=DeckPoint(x=4, y=5, z=6)
)
attach_or_detach = SavedPositionData(
    positionId="attach_position", position=DeckPoint(x=1, y=2, z=3)
)
=======
)
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import DeckSlotName, Point, CalibrationPositions


probe_position = DeckPoint(x=4, y=5, z=6)
attach_or_detach = DeckPoint(x=1, y=2, z=3)
>>>>>>> 95996d6e1 (still need to add result)


def mock_deck_slot_center(slot_name: DeckSlotName) -> Point:
    """Return a point value for each deck slot input."""
    if slot_name == DeckSlotName.SLOT_2:
        return Point(1, 2, 3)
    elif slot_name == DeckSlotName.SLOT_5:
        return Point(4, 5, 6)
    else:
        return Point(7, 8, 9)


@pytest.mark.parametrize(
<<<<<<< HEAD
    argnames=["slot_name", "movement_result"],
=======
    argnames=["slot_name", "movement_coordinates"],
>>>>>>> 95996d6e1 (still need to add result)
    argvalues=[
        [CalibrationPositions.probe_position, probe_position],
        [CalibrationPositions.attach_or_detach, attach_or_detach],
    ],
)
async def test_calibration_set_up_position_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    slot_name: CalibrationPositions,
<<<<<<< HEAD
    movement_result: SavedPositionData,
=======
    movement_coordinates: DeckPoint,
>>>>>>> 95996d6e1 (still need to add result)
) -> None:
    """Command should get a Point value for a given deck slot center and \
        call Movement.move_to_coordinates with the correct input."""
    subject = MoveToLocationImplementation(state_view=state_view, movement=movement)

    params = MoveToLocationParams(
        pipetteId="pipette-id",
        slot_name=slot_name,
    )
<<<<<<< HEAD

=======
>>>>>>> 95996d6e1 (still need to add result)
    with mock.patch.object(
        state_view.labware, "get_slot_center_position", new=mock_deck_slot_center
    ):
        result = await subject.execute(params=params)

<<<<<<< HEAD
    assert result == MoveToLocationResult(position=movement_result)
=======
    assert result == MoveToLocationResult()
>>>>>>> 95996d6e1 (still need to add result)

    decoy.verify(
        await movement.move_to_coordinates(
            pipette_id="pipette-id",
<<<<<<< HEAD
            deck_coordinates=movement_result.position,
=======
            deck_coordinates=movement_coordinates,
>>>>>>> 95996d6e1 (still need to add result)
            direct=True,
            additional_min_travel_z=0,
        )
    )
