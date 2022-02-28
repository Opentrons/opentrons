"""Tests for motion methods."""
from opentrons_hardware.drivers.can_bus import NodeId
from opentrons_hardware.hardware_control.motion import (
    create_step,
    MoveGroupSingleAxisStep,
)


def test_build_move() -> None:
    """It should build a move step.

    Nodes in present_nodes but not in the move should be added.
    Nodes in the move but not in present_nodes should be removed.
    """
    expected = {
        NodeId.gantry_x: MoveGroupSingleAxisStep(
            distance_mm=0.0,
            velocity_mm_sec=0.0,
            duration_sec=10,
            acceleration_mm_sec_sq=0,
        ),
        NodeId.gantry_y: MoveGroupSingleAxisStep(
            distance_mm=0.0,
            velocity_mm_sec=0.0,
            duration_sec=10,
            acceleration_mm_sec_sq=0,
        ),
        NodeId.head_r: MoveGroupSingleAxisStep(
            distance_mm=0.0,
            velocity_mm_sec=0.0,
            duration_sec=10,
            acceleration_mm_sec_sq=0,
        ),
        NodeId.head_l: MoveGroupSingleAxisStep(
            distance_mm=4,
            velocity_mm_sec=0.25,
            duration_sec=10,
            acceleration_mm_sec_sq=1000,
        ),
    }
    assert expected == create_step(
        distance={NodeId.head_l: 4, NodeId.pipette_right: 10},
        velocity={NodeId.head_l: 0.25, NodeId.pipette_right: 0.3},
        acceleration={NodeId.head_l: 1000, NodeId.pipette_right: 1000},
        duration=10,
        present_nodes=set(
            (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_r, NodeId.head_l)
        ),
    )
