from opentrons_hardware.hardware_control.motion_planning import Move
from opentrons.hardware_control.backends import ot3utils
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons.hardware_control.types import OT3Axis


def test_create_step() -> None:
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


def test_nodeid_replace_head() -> None:
    assert ot3utils.replace_head_node(set([NodeId.head, NodeId.gantry_x])) == set(
        [NodeId.head_l, NodeId.head_r, NodeId.gantry_x]
    )
    assert ot3utils.replace_head_node(set([NodeId.gantry_x])) == set([NodeId.gantry_x])
    assert ot3utils.replace_head_node(set([NodeId.head_l])) == set([NodeId.head_l])


def test_nodeid_replace_gripper() -> None:
    assert ot3utils.replace_gripper_node(set([NodeId.gripper, NodeId.head])) == set(
        [NodeId.gripper_g, NodeId.gripper_z, NodeId.head]
    )
    assert ot3utils.replace_gripper_node(set([NodeId.head])) == set([NodeId.head])
    assert ot3utils.replace_gripper_node(set([NodeId.gripper_g])) == set(
        [NodeId.gripper_g]
    )
