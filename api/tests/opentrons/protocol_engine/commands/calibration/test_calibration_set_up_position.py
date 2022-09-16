from decoy import Decoy
import pytest
import mock
from typing import Optional, Dict

from opentrons.protocol_engine.commands.calibration.move_to_start_calibration import (
    CalibrationSetUpPosition,
    CalibrationPositions,
    CalibrationSetUpPositionParams,
    CalibrationSetUpPositionImplementation,
    CalibrationSetUpPositionResult,
)
from opentrons.shared_data.python.opentrons
# if TYPE_CHECKING:
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import DeckSlotName, Point

#
# def get_labware_view() -> LabwareView:
#     """Get a labware view test subject."""
#     labware_state = LabwareState(
#         labware_by_id= {},
#         labware_offsets_by_id= {},
#         definitions_by_uri= {},
#         deck_definition= cast(DeckDefinitionV3, {"fake": True}),
#     )
#
#     # labware_view = LabwareView(state=state)
#     state = State(labware=labware_state)

# fix this
@pytest.fixture
def mock_deck_slot_center(state_view: StateView, slot_name: DeckSlotName) -> Point:
    labware_view = state_view.labware
    with patch.object(
        labware_view, "get_slot_center_position",
    )



@pytest.fixture
def mock_deck_slot_center(slot_name: DeckSlotName) -> Point:
    if slot_name == DeckSlotName.SLOT_2:
        return Point(x=1, y=2, z=3)
    elif slot_name == DeckSlotName.SLOT_5:
        return Point(x=4, y=5, z=6)
    else:
        return Point(x=7, y=8, z=9)


async def test_calibration_set_up_position_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
) -> None:

    subject = CalibrationSetUpPositionImplementation(
        state_view=state_view, movement=movement
    )

    params = CalibrationSetUpPositionParams(
        pipetteId="pipette-id",
        slot_name=CalibrationPositions.start_calibration,
    )

    result = await subject.execute(params=params)

    assert result == CalibrationSetUpPositionResult()

    decoy.verify(
        await movement.move_to_coordinates(
            pipette_id="pipette-id",
            deck_coordinates=DeckPoint(x=4, y=5, z=6),
            direct=True,
            additional_min_travel_z=0,
        )
    )
