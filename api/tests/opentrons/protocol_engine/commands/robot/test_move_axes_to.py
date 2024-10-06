"""Test robot.move-axes-to commands."""
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI

from opentrons.protocol_engine.execution import MovementHandler, GantryMover
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import MotorAxis
from opentrons.hardware_control.protocols.types import FlexRobotType, OT2RobotType
from opentrons.types import Point, MountType

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.robot.move_axes_to import (
    MoveAxesToParams,
    MoveAxesToResult,
    MoveAxesToImplementation,
)


async def test_move_to_implementation(
    decoy: Decoy,
    state_view: StateView,
    gantry_mover: GantryMover,
    movement: MovementHandler,
    hardware_api: HardwareControlAPI,
) -> None:
    """Test the `robot.moveAxesTo` implementation.

    It should call `MovementHandler.move_mount_to` with the
    correct coordinates.
    """
    subject = MoveAxesToImplementation(
        state_view=state_view,
        gantry_mover=gantry_mover,
        movement=movement,
        hardware_api=hardware_api,
    )

    params = MoveAxesToParams(
        axis_map={MotorAxis.X: 10, MotorAxis.Y: 10, MotorAxis.EXTENSION_Z: 20},
        critical_point={MotorAxis.X: 1, MotorAxis.Y: 1, MotorAxis.EXTENSION_Z: 0},
        speed=567.8,
    )

    # OT 2 shape
    decoy.when(hardware_api.get_robot_type()).then_return(OT2RobotType)

    result = await subject.execute(params=params)

    assert result == SuccessData(
        public=MoveAxesToResult(
            position={MotorAxis.X: 10, MotorAxis.Y: 10, MotorAxis.EXTENSION_Z: 20}
        ),
        private=None,
    )

    # Flex shape
    decoy.when(hardware_api.get_robot_type()).then_return(FlexRobotType)

    result = await subject.execute(params=params)

    assert result == SuccessData(
        public=MoveAxesToResult(
            position={MotorAxis.X: 10, MotorAxis.Y: 10, MotorAxis.EXTENSION_Z: 20}
        ),
        private=None,
    )
