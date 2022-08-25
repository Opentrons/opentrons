from opentrons_hardware.hardware_control.motion_planning import Move
from opentrons.hardware_control.backends import ot3utils
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons.hardware_control.types import OT3Axis, OT3AxisKind


def test_create_step():
    origin = {
        OT3Axis.X: 0,
        OT3Axis.Y: 0,
        OT3Axis.Z_L: 0,
        OT3Axis.Z_R: 0,
        OT3Axis.P_L: 0,
        OT3Axis.P_R: 0,
    }
    moves = [
        Move.build_dummy([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L])
    ]
    present_nodes = [NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l]
    move_group, final_pos = ot3utils.create_move_group(
        origin=origin,
        moves=moves,
        present_nodes=present_nodes,
    )
    assert len(move_group) == 3
    for step in move_group:
        assert set(present_nodes) == set(step.keys())


def test_axis_kind_to_axis_map_function():
    # Map with all OT3AxisKind enums
    axis_kind_map = {
        OT3AxisKind.X: 1,
        OT3AxisKind.Y: 2,
        OT3AxisKind.Z: 3,
        OT3AxisKind.P: 4,
        OT3AxisKind.Z_G: 5,
        OT3AxisKind.OTHER: 6,
    }
    axis_map = ot3utils.axis_kind_to_axis_map(axis_kind_map)
    assert axis_map == {
        OT3Axis.X: 1,
        OT3Axis.Y: 2,
        OT3Axis.Z_L: 3,
        OT3Axis.Z_R: 3,
        OT3Axis.P_L: 4,
        OT3Axis.P_R: 4,
        OT3Axis.Z_G: 5,
        OT3Axis.Q: 6,
        OT3Axis.G: 6,
    }

    # Map with a few OT3AxisKind enums
    axis_kind_map = {
        OT3AxisKind.X: 1,
        OT3AxisKind.Y: 2,
        OT3AxisKind.P: 4,
        OT3AxisKind.Z_G: 5,
    }
    axis_map = ot3utils.axis_kind_to_axis_map(axis_kind_map)
    assert axis_map == {
        OT3Axis.X: 1,
        OT3Axis.Y: 2,
        OT3Axis.P_L: 4,
        OT3Axis.P_R: 4,
        OT3Axis.Z_G: 5,
    }
