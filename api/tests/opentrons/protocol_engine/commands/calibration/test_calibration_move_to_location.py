"""Test for Calibration Set Up Position Implementation."""
from decoy import Decoy
import pytest

from opentrons.protocol_engine.commands.calibration.move_to_location import (
    MoveToLocationParams,
    MoveToLocationImplementation,
)
from opentrons.protocol_engine.execution import SavedPositionData
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point, MountType, Mount
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_engine.types import DeckPoint, CalibrationPosition


@pytest.fixture
def subject(
    state_view: StateView, hardware_api: HardwareControlAPI
) -> MoveToLocationImplementation:
    """Get command subject to test."""
    return MoveToLocationImplementation(
        state_view=state_view, hardware_api=hardware_api
    )


@pytest.mark.parametrize(
    argnames=["slot_name"],
    argvalues=[
        [CalibrationPosition.PROBE_POSITION],
        [CalibrationPosition.ATTACH_OR_DETACH],
    ],
)
async def test_calibration_set_up_position_implementation(
    decoy: Decoy,
    slot_name: CalibrationPosition,
    subject: MoveToLocationImplementation,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
) -> None:
    """Command should get a Point value for a given deck slot center and \
        call Movement.move_to_coordinates with the correct input."""

    def movement_coordinate(slot: CalibrationPosition) -> SavedPositionData:
        if slot == CalibrationPosition.PROBE_POSITION:
            return probe_position
        else:
            return attach_or_detach

    params = MoveToLocationParams(
        mount=MountType.LEFT,
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
        state_view.labware.get_calibration_coordinates(
            CalibrationPosition.PROBE_POSITION
        )
    ).then_return((Point(x=1, y=2, z=3), CriticalPoint.MOUNT))

    result = await subject.execute(params=params)
    assert result == Point(x=1, y=1, z=1)

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=1, y=2, z=3),
            critical_point=CriticalPoint.MOUNT,
        )
    )
