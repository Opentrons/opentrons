from opentrons_hardware.hardware_control.motion_planning import Coordinates, Move
from opentrons.hardware_control.backends import ot3utils
from opentrons_ot3_firmware.constants import NodeId


def test_create_step():
    origin = Coordinates(0, 0, 0, 0, 0, 0)
    moves = [Move.build_dummy_move()]
    present_nodes = [NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l]
    move_group, final_pos = ot3utils.create_move_group(
        origin=origin,
        moves=moves,
        present_nodes=present_nodes,
    )
    assert len(move_group) == 3
    for step in move_group:
        assert set(present_nodes) == set(step.keys())
