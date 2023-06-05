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
from opentrons.types import MountType
from opentrons.hardware_control.types import OT3Axis

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
            {OT3Axis.Y: 100, OT3Axis.X: 0, OT3Axis.Z_L: 400},
        ),
        (
            MaintenancePosition.AttachPlate,
            {OT3Axis.Y: 100, OT3Axis.X: 0, OT3Axis.Z_L: 300, OT3Axis.Z_R: 320},
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

    result = await subject.execute(params=params)
    assert result == MoveToMaintenancePositionResult()

    decoy.verify(
        await ot3_hardware_api.move_axes(
            position=verify_axes,
        ),
        times=1,
    )
