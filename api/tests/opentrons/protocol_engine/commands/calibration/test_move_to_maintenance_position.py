"""Test for Calibration Set Up Position Implementation."""
import pytest
from decoy import Decoy
from typing import List
from typing_extensions import TYPE_CHECKING

from opentrons.protocol_engine.commands.calibration.move_to_maintenance_position import (
    MoveToMaintenancePositionParams,
    MoveToMaintenancePositionImplementation,
    MoveToMaintenancePositionResult,
    MaintenancePosition,
)

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point, MountType, Mount
from opentrons.hardware_control.types import CriticalPoint, OT3Axis

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def subject(
    state_view: StateView, hardware_api: HardwareControlAPI
) -> MoveToMaintenancePositionImplementation:
    """Get command subject to test."""
    return MoveToMaintenancePositionImplementation(
        state_view=state_view, hardware_api=hardware_api
    )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "maintenance_position, z_offset, verify_axes",
    [
        (
            MaintenancePosition.AttachInstrument,
            400,
            [OT3Axis.Z_L, OT3Axis.X, OT3Axis.Y],
        ),
        (
            MaintenancePosition.AttachPlate,
            260,
            [OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.X, OT3Axis.Y],
        ),
    ],
)
async def test_calibration_move_to_location_implementation(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    ot3_hardware_api: OT3API,
    maintenance_position: MaintenancePosition,
    z_offset: int,
    verify_axes: List[OT3Axis],
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(
        mount=MountType.LEFT, maintenance_position=maintenance_position
    )

    result = await subject.execute(params=params)
    assert result == MoveToMaintenancePositionResult()

    decoy.verify(
        await hardware_api.move_axes(
            position=verify_axes,
        ),
        times=1,
    )
