"""Tests for motion methods."""
from opentrons_hardware.drivers.can_bus import NodeId
from opentrons_hardware.hardware_control.motion import create, MoveGroupSingleAxisStep


def test_create_just_head() -> None:
    """It should create a move in head."""
    expected = [
        [
            {
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=-2, velocity_mm_sec=-0.25, duration_sec=8
                ),
            }
        ]
    ]
    assert (
        create(
            origin={NodeId.head_l: 4},
            target={NodeId.head_l: 2},
            speed=0.25,
        )
        == expected
    )


def test_create_just_x_y() -> None:
    """It should create a move in just x and y."""
    expected = [
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=2, velocity_mm_sec=0.25, duration_sec=8
                ),
            }
        ],
        [
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=2, velocity_mm_sec=0.25, duration_sec=8
                ),
            }
        ],
    ]
    assert (
        create(
            origin={NodeId.gantry_x: 0, NodeId.gantry_y: 0},
            target={NodeId.gantry_x: 2, NodeId.gantry_y: 2},
            speed=0.25,
        )
        == expected
    )


def test_create_all() -> None:
    """It should create a move in all axes."""
    expected = [
        [
            {
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=4, velocity_mm_sec=0.05, duration_sec=80
                ),
            }
        ],
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=2, velocity_mm_sec=0.05, duration_sec=40
                ),
            }
        ],
        [
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=2, velocity_mm_sec=0.05, duration_sec=40
                ),
            }
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
