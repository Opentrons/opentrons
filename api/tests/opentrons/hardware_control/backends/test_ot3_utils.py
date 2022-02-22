from opentrons_hardware.hardware_control.motion_planning import Move
from opentrons.hardware_control.backends import ot3utils
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons.hardware_control.types import OT3Axis


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
