"""Test for Calibration Set Up Position Implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.move_to_location import (
    MoveToLocationParams,
    MoveToLocationImplementation,
    MoveToLocationResult,
)
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point, MountType, Mount
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_engine.types import CalibrationPosition, CalibrationCoordinates


@pytest.fixture
def subject(
    state_view: StateView, hardware_api: HardwareControlAPI
) -> MoveToLocationImplementation:
    """Get command subject to test."""
    return MoveToLocationImplementation(
        state_view=state_view, hardware_api=hardware_api
    )


async def test_calibration_move_to_location_implementation(
    decoy: Decoy,
    subject: MoveToLocationImplementation,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
) -> None:
    """Command should get a Point value for a given deck slot center and \
        call Movement.move_to_coordinates with the correct input."""
    params = MoveToLocationParams(
        mount=MountType.LEFT,
        location=CalibrationPosition.INSTRUMENT_ATTACH,
    )

    decoy.when(
        state_view.labware.get_calibration_coordinates(
            location=CalibrationPosition.INSTRUMENT_ATTACH
        )
    ).then_return(
        CalibrationCoordinates(
            coordinates=Point(x=1, y=2, z=3), critical_point=CriticalPoint.MOUNT
        )
    )

    result = await subject.execute(params=params)
    assert result == MoveToLocationResult()

    decoy.verify(
        await hardware_api.home_z(
            mount=Mount.LEFT,
        ),
        times=1,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=1, y=2, z=3),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )
