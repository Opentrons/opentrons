"""Test for Calibration Set Up Position Implementation."""
from __future__ import annotations
from typing import TYPE_CHECKING, Mapping

import pytest
from decoy import Decoy

from opentrons.motion_planning import Waypoint
from opentrons.protocol_engine.commands.calibration.move_to_maintenance_position import (
    MoveToMaintenancePositionParams,
    MoveToMaintenancePositionImplementation,
    MoveToMaintenancePositionResult,
    MaintenancePosition,
)

from opentrons.protocol_engine.state import StateView
from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.types import OT3Axis, CriticalPoint

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.mark.ot3_only
@pytest.fixture
def subject(
    ot3_hardware_api: OT3API, state_view: StateView
) -> MoveToMaintenancePositionImplementation:
    """Returns the subject under test."""
    return MoveToMaintenancePositionImplementation(
        state_view=state_view, hardware_api=ot3_hardware_api
    )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "maintenance_position, verify_axes",
    [
        (
            MaintenancePosition.AttachInstrument,
            {OT3Axis.Z_L: 400},
        ),
        (
            MaintenancePosition.AttachPlate,
            {OT3Axis.Z_L: 295, OT3Axis.Z_R: 320},
        ),
    ],
)
async def test_calibration_move_to_location_implementation(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    ot3_hardware_api: OT3API,
    maintenance_position: MaintenancePosition,
    verify_axes: Mapping[OT3Axis, float],
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(
        mount=MountType.LEFT, maintenancePosition=maintenance_position
    )

    decoy.when(await ot3_hardware_api.gantry_position(Mount.LEFT)).then_return(
        Point(x=1, y=2, z=3)
    )

    decoy.when(ot3_hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(12)

    decoy.when(
        state_view.motion.get_movement_waypoints_to_coords(
            origin=Point(x=1, y=2, z=3),
            dest=Point(x=0, y=100, z=0),
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

    decoy.when(await ot3_hardware_api.gantry_position(Mount.RIGHT)).then_return(
        Point(x=6, y=6, z=6)
    )

    result = await subject.execute(params=params)
    assert result == MoveToMaintenancePositionResult()

    decoy.verify(
        await ot3_hardware_api.move_axes(
            position=verify_axes,
        ),
        times=1,
    )
