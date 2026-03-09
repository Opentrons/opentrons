"""Tests for motion methods."""
from numpy import float64
from opentrons_hardware.drivers.can_bus import NodeId
from opentrons_hardware.firmware_bindings.constants import MoveStopCondition
from opentrons_hardware.hardware_control.motion import (
    MoveType,
    create_step,
    create_home_step,
    create_backoff_step,
    MoveGroupSingleAxisStep,
)


def test_build_move() -> None:
    """It should build a move step.

    Nodes in present_nodes but not in the move should be added.
    Nodes in the move but not in present_nodes should be removed.
    """
    expected = {
        NodeId.gantry_x: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.gantry_y: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.head_r: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.head_l: MoveGroupSingleAxisStep(
            distance_mm=float64(4),
            velocity_mm_sec=float64(0.25),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(1000),
        ),
    }
    assert expected == create_step(
        distance={NodeId.head_l: float64(4), NodeId.pipette_right: float64(10)},
        velocity={NodeId.head_l: float64(0.25), NodeId.pipette_right: float64(0.3)},
        acceleration={
            NodeId.head_l: float64(1000),
            NodeId.pipette_right: float64(1000),
        },
        duration=float64(10),
        present_nodes=set(
            (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_r, NodeId.head_l)
        ),
    )


def test_build_move_with_jaw_node() -> None:
    """It should build a move step and remove gripper g if its in present_nodes.

    Nodes in present_nodes but not in the move should be added.
    Nodes in the move but not in present_nodes should be removed.
    """
    expected = {
        NodeId.gantry_x: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.gantry_y: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.head_r: MoveGroupSingleAxisStep(
            distance_mm=float64(0.0),
            velocity_mm_sec=float64(0.0),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(0),
        ),
        NodeId.head_l: MoveGroupSingleAxisStep(
            distance_mm=float64(4),
            velocity_mm_sec=float64(0.25),
            duration_sec=float64(10),
            acceleration_mm_sec_sq=float64(1000),
        ),
    }
    assert expected == create_step(
        distance={NodeId.head_l: float64(4), NodeId.pipette_right: float64(10)},
        velocity={NodeId.head_l: float64(0.25), NodeId.pipette_right: float64(0.3)},
        acceleration={
            NodeId.head_l: float64(1000),
            NodeId.pipette_right: float64(1000),
        },
        duration=float64(10),
        present_nodes=set(
            (
                NodeId.gantry_x,
                NodeId.gantry_y,
                NodeId.head_r,
                NodeId.head_l,
                NodeId.gripper_g,
            )
        ),
    )


def test_build_linear_home_step() -> None:
    """It should build linear home step."""
    expected = {
        NodeId.pipette_right: MoveGroupSingleAxisStep(
            distance_mm=float64(10.0),
            velocity_mm_sec=float64(-0.5),
            duration_sec=float64(20.0),
            acceleration_mm_sec_sq=float64(0),
            stop_condition=MoveStopCondition.limit_switch,
            move_type=MoveType.home,
        ),
        NodeId.head_l: MoveGroupSingleAxisStep(
            distance_mm=float64(4),
            velocity_mm_sec=float64(-0.1),
            duration_sec=float64(40),
            acceleration_mm_sec_sq=float64(0),
            stop_condition=MoveStopCondition.limit_switch,
            move_type=MoveType.home,
        ),
    }
    distance = {NodeId.head_l: float64(4), NodeId.pipette_right: float64(10)}
    velocity = {NodeId.head_l: float64(-0.1), NodeId.pipette_right: float64(-0.5)}
    assert expected == create_home_step(distance, velocity)


def test_build_limit_switch_backoff_step() -> None:
    """It should build linear limit switch backoff step."""
    expected = {
        NodeId.pipette_right: MoveGroupSingleAxisStep(
            distance_mm=float64(5.0),
            velocity_mm_sec=float64(0.5),
            duration_sec=float64(10.0),
            acceleration_mm_sec_sq=float64(0),
            stop_condition=MoveStopCondition.limit_switch_backoff,
        ),
        NodeId.head_l: MoveGroupSingleAxisStep(
            distance_mm=float64(5.0),
            velocity_mm_sec=float64(0.1),
            duration_sec=float64(50),
            acceleration_mm_sec_sq=float64(0),
            stop_condition=MoveStopCondition.limit_switch_backoff,
        ),
    }
    velocity = {NodeId.head_l: float64(-0.1), NodeId.pipette_right: float64(-0.5)}
    assert expected == create_backoff_step(velocity)
