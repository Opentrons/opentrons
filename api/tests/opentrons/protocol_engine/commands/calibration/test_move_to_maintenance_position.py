"""Test for Calibration Set Up Position Implementation."""
from __future__ import annotations
from typing import TYPE_CHECKING, Mapping

import pytest
from decoy import Decoy

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
            MaintenancePosition.ATTACH_INSTRUMENT,
            {OT3Axis.Z_L: 400},
        ),
        (
            MaintenancePosition.ATTACH_PLATE,
            {OT3Axis.Z_L: 90, OT3Axis.Z_R: 105},
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

    decoy.when(
        await ot3_hardware_api.gantry_position(
            Mount.LEFT, critical_point=CriticalPoint.MOUNT
        )
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        ot3_hardware_api.get_instrument_max_height(
            Mount.LEFT, critical_point=CriticalPoint.MOUNT
        )
    ).then_return(250)

    decoy.when(ot3_hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(300)

    result = await subject.execute(params=params)
    assert result == MoveToMaintenancePositionResult()

    decoy.verify(
        await ot3_hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=1, y=2, z=250),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )

    decoy.verify(
        await ot3_hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=0, y=110, z=250),
            critical_point=CriticalPoint.MOUNT,
        ),
        times=1,
    )

    decoy.verify(
        await ot3_hardware_api.move_axes(
            position=verify_axes,
        ),
        times=1,
    )
