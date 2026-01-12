"""Test for Calibration Set Up Position Implementation."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from decoy import Decoy

from opentrons.hardware_control.types import Axis, CriticalPoint
from opentrons.protocol_engine.commands.calibration.move_to_maintenance_position import (
    MaintenancePosition,
    MoveToMaintenancePositionImplementation,
    MoveToMaintenancePositionParams,
    MoveToMaintenancePositionResult,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.state.state import StateView
from opentrons.types import Mount, MountType, Point

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def subject(
    ot3_hardware_api: OT3API, state_view: StateView
) -> MoveToMaintenancePositionImplementation:
    """Returns the subject under test."""
    return MoveToMaintenancePositionImplementation(
        state_view=state_view, hardware_api=ot3_hardware_api
    )


@pytest.mark.ot3_only
@pytest.mark.parametrize("mount_type", [MountType.LEFT, MountType.RIGHT])
async def test_calibration_move_to_location_implementation_for_attach_instrument(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    ot3_hardware_api: OT3API,
    mount_type: MountType,
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(
        mount=mount_type, maintenancePosition=MaintenancePosition.ATTACH_INSTRUMENT
    )

    decoy.when(
        await ot3_hardware_api.gantry_position(
            Mount.LEFT, critical_point=CriticalPoint.MOUNT
        )
    ).then_return(Point(x=1, y=2, z=250))

    decoy.when(ot3_hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(300)

    result = await subject.execute(params=params)
    assert result == SuccessData(
        public=MoveToMaintenancePositionResult(),
    )

    hw_mount = mount_type.to_hw_mount()
    decoy.verify(
        await ot3_hardware_api.prepare_for_mount_movement(Mount.LEFT),
        await ot3_hardware_api.retract(Mount.LEFT),
        await ot3_hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=0, y=110, z=250),
            critical_point=CriticalPoint.MOUNT,
        ),
        await ot3_hardware_api.prepare_for_mount_movement(hw_mount),
        await ot3_hardware_api.move_axes(
            position={Axis.by_mount(hw_mount): 400},
        ),
        await ot3_hardware_api.disengage_axes(
            [Axis.by_mount(hw_mount)],
        ),
    )


@pytest.mark.ot3_only
@pytest.mark.parametrize("mount_type", [MountType.LEFT, MountType.RIGHT])
async def test_calibration_move_to_location_implementation_for_attach_plate(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    ot3_hardware_api: OT3API,
    mount_type: MountType,
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(
        mount=mount_type, maintenancePosition=MaintenancePosition.ATTACH_PLATE
    )

    decoy.when(
        await ot3_hardware_api.gantry_position(
            Mount.LEFT, critical_point=CriticalPoint.MOUNT
        )
    ).then_return(Point(x=1, y=2, z=250))

    decoy.when(ot3_hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(300)

    result = await subject.execute(params=params)
    assert result == SuccessData(
        public=MoveToMaintenancePositionResult(),
    )

    decoy.verify(
        await ot3_hardware_api.prepare_for_mount_movement(Mount.LEFT),
        await ot3_hardware_api.retract(Mount.LEFT),
        await ot3_hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=0, y=110, z=250),
            critical_point=CriticalPoint.MOUNT,
        ),
        await ot3_hardware_api.move_axes(
            position={
                Axis.Z_L: 90,
            }
        ),
        await ot3_hardware_api.disengage_axes(
            [Axis.Z_L],
        ),
        await ot3_hardware_api.move_axes(
            position={
                Axis.Z_R: 105,
            }
        ),
        await ot3_hardware_api.disengage_axes(
            [Axis.Z_R],
        ),
    )


@pytest.mark.ot3_only
async def test_calibration_move_to_location_implementation_for_gripper(
    decoy: Decoy,
    subject: MoveToMaintenancePositionImplementation,
    state_view: StateView,
    ot3_hardware_api: OT3API,
) -> None:
    """Command should get a move to target location and critical point and should verify move_to call."""
    params = MoveToMaintenancePositionParams(
        mount=MountType.EXTENSION,
        maintenancePosition=MaintenancePosition.ATTACH_INSTRUMENT,
    )

    decoy.when(
        await ot3_hardware_api.gantry_position(
            Mount.LEFT, critical_point=CriticalPoint.MOUNT
        )
    ).then_return(Point(x=1, y=2, z=250))
    decoy.when(ot3_hardware_api.get_instrument_max_height(Mount.LEFT)).then_return(300)

    result = await subject.execute(params=params)
    assert result == SuccessData(
        public=MoveToMaintenancePositionResult(),
    )

    decoy.verify(
        await ot3_hardware_api.prepare_for_mount_movement(Mount.LEFT),
        await ot3_hardware_api.retract(Mount.LEFT),
        await ot3_hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(x=0, y=110, z=250),
            critical_point=CriticalPoint.MOUNT,
        ),
    )

    decoy.verify(
        await ot3_hardware_api.move_axes(
            position={Axis.Z_G: 400},
        ),
        times=0,
    )
    decoy.verify(
        await ot3_hardware_api.disengage_axes(
            [Axis.Z_G],
        ),
        times=0,
    )
