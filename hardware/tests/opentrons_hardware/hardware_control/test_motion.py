"""Tests for motion methods."""
from opentrons_hardware.drivers.can_bus import NodeId
from opentrons_hardware.hardware_control.motion import (
    create,
    MoveGroupSingleAxisStep,
    MAX_SPEEDS,
)
import math


def test_only_specified_nodes() -> None:
    """It should only add specified nodes, if specified."""
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=-2.0, velocity_mm_sec=-0.25, duration_sec=8.0
                ),
            },
        ],
    ]
    assert expected == create(
        origin={NodeId.head_l: 4, NodeId.pipette_right: 10},
        target={NodeId.head_l: 2, NodeId.pipette_right: 20},
        speed=0.25,
        present_nodes=set(
            (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_r, NodeId.head_l)
        ),
    )


def test_create_just_head() -> None:
    """It should create a move in head."""
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=-2.0, velocity_mm_sec=-0.25, duration_sec=8.0
                ),
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
                NodeId.pipette_right: MoveGroupSingleAxisStep(
                    distance_mm=0.0, velocity_mm_sec=0.0, duration_sec=8.0
                ),
            },
        ],
    ]
    assert expected == create(
        origin={NodeId.head_l: 4},
        target={NodeId.head_l: 2},
        speed=0.25,
    )


def test_create_just_x_y() -> None:
    """It should create a move in just x and y."""
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=2.0,
                    velocity_mm_sec=0.25 / math.sqrt(2),
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=-2.0,
                    velocity_mm_sec=-(0.25) / math.sqrt(2),
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
                NodeId.pipette_right: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(8) / 0.25, 6),
                ),
            }
        ],
    ]
    assert expected == create(
        origin={NodeId.gantry_x: 0, NodeId.gantry_y: 2},
        target={NodeId.gantry_x: 2, NodeId.gantry_y: 0},
        speed=0.25,
    )


def test_create_all() -> None:
    """It should create a move in all axes."""
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=2.0,
                    velocity_mm_sec=0.05 * (2 / math.sqrt(24)),
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=2.0,
                    velocity_mm_sec=0.05 * (2 / math.sqrt(24)),
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=4.0,
                    velocity_mm_sec=0.05 * (4 / math.sqrt(24)),
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
                NodeId.pipette_right: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=round(math.sqrt(24) / 0.05, 6),
                ),
            },
        ],
    ]
    assert (
        create(
            origin={NodeId.head_l: 0, NodeId.gantry_x: 0, NodeId.gantry_y: 0},
            target={NodeId.head_l: 4, NodeId.gantry_x: 2, NodeId.gantry_y: 2},
            speed=0.05,
        )
        == expected
    )


def test_limit_speeds_single_axis() -> None:
    """It should limit maximum speeds as in MAX_SPEEDS."""
    target_speed = MAX_SPEEDS[NodeId.gantry_x]
    target_distance = 10
    target_duration = round(10 / MAX_SPEEDS[NodeId.gantry_x], 6)
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=target_distance,
                    velocity_mm_sec=target_speed,
                    duration_sec=target_duration,
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=target_duration,
                ),
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=target_duration,
                ),
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=target_duration,
                ),
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=target_duration,
                ),
                NodeId.pipette_right: MoveGroupSingleAxisStep(
                    distance_mm=0.0,
                    velocity_mm_sec=0.0,
                    duration_sec=target_duration,
                ),
            },
        ]
    ]
    assert (
        create(
            origin={NodeId.gantry_x: 0},
            target={NodeId.gantry_x: target_distance},
            speed=MAX_SPEEDS[NodeId.gantry_x] * 2,
        )
        == expected
    )
