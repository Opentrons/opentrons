"""Test for Calibration Set Up Position Implementation."""
import pytest
from decoy import Decoy

from opentrons.motion_planning.types import Waypoint
from opentrons.protocol_engine.commands.calibration.move_to_maintenance_position import (
    MoveToMaintenancePositionParams,
    MoveToMaintenancePositionImplementation,
    MoveToMaintenancePositionResult,
)

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.types import Point, MountType, Mount
from opentrons.hardware_control.types import CriticalPoint


@pytest.fixture
def subject(
    state_view: StateView, hardware_api: HardwareControlAPI, movement: MovementHandler
) -> MoveToMaintenancePositionImplementation:
    """Get command subject to test."""
    return MoveToMaintenancePositionImplementation(
        state_view=state_view, hardware_api=hardware_api, movement=movement
    )


async def test_calibration_move_to_location_implementation(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(mount=MountType.RIGHT)

    decoy.when(await hardware_api.gantry_position(Mount.LEFT)).then_return(
        Point(x=1, y=2, z=3)
    )

    decoy.when(hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(12)

    decoy.when(
        state_view.motion.get_movement_waypoints_to_coords(
            origin=Point(x=1, y=2, z=3),
            dest=Point(x=-13.775, y=84),
            max_travel_z=12,
            direct=False,
            additional_min_travel_z=None,
        )
    ).then_return(
        [
            Waypoint(position=Point(3, 1, 4), critical_point=None),
            Waypoint(position=Point(1, 5, 9), critical_point=CriticalPoint.XY_CENTER),
        ]
    )

    result = await subject.execute(params=params)
    assert result == MoveToMaintenancePositionResult()

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(3, 1, 4),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(1, 5, 9),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.RIGHT,
            abs_position=Point(z=400),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )
