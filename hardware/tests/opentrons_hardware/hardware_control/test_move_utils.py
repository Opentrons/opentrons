"""Tests for move util functions."""
import pytest
import numpy as np  # type: ignore[import]
from typing import Iterator, List
from hypothesis import given, strategies as st, assume

from opentrons_hardware.hardware_control.motion_planning.move_manager import MoveManager
from opentrons_hardware.hardware_control.motion_planning.move_utils import (
    find_initial_speed,
    find_final_speed,
    targets_to_moves,
    all_blended,
    get_unit_vector,
    FLOAT_THRESHOLD,
)
from opentrons_hardware.hardware_control.motion_planning.types import (
    AxisConstraints,
    Block,
    Move,
    MoveTarget,
    SystemConstraints,
    is_unit_vector,
)

AXES = ["X", "Y", "Z", "A"]
SIXAXES = ["X", "Y", "Z", "A", "B", "C"]

CONSTRAINTS: SystemConstraints[str] = {
    "X": AxisConstraints.build(
        max_acceleration=np.float64(10),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(500),
    ),
    "Y": AxisConstraints.build(
        max_acceleration=np.float64(10),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(500),
    ),
    "Z": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
    ),
    "A": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
    ),
    "B": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
    ),
    "C": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
    ),
}


SIMPLE_FORWARD_MOVE = Move.build(
    unit_vector={
        "X": np.float64(1),
        "Y": np.float64(0),
        "Z": np.float64(0),
        "A": np.float64(0),
    },
    distance=np.float64(1),
    max_speed=np.float64(1),
    blocks=(
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
    ),
)

SIMPLE_BACKWARD_MOVE = Move.build(
    unit_vector={
        "X": np.float64(-1),
        "Y": np.float64(0),
        "Z": np.float64(0),
        "A": np.float64(0),
    },
    distance=np.float64(1),
    max_speed=np.float64(1),
    blocks=(
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
        Block(
            distance=np.float64(10),
            initial_speed=np.float64(1),
            acceleration=np.float64(0),
        ),
    ),
)

DUMMY_MOVE = Move.build_dummy(["X", "Y", "Z", "A"])


def test_convert_targets_to_moves() -> None:
    """It should convert a list of move targets into a list of moves."""
    targets = [
        MoveTarget.build(
            {
                "X": np.float64(10),
                "Y": np.float64(0),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            np.float64(1),
        ),
        MoveTarget.build(
            {
                "X": np.float64(10),
                "Y": np.float64(20),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            np.float64(2),
        ),
        MoveTarget.build(
            {
                "X": np.float64(10),
                "Y": np.float64(20),
                "Z": np.float64(151),
                "A": np.float64(0),
            },
            np.float64(3),
        ),
        MoveTarget.build(
            {
                "X": np.float64(10),
                "Y": np.float64(20),
                "Z": np.float64(151),
                "A": np.float64(1255),
            },
            np.float64(4),
        ),
    ]

    expected = [
        Move.build(
            unit_vector={
                "X": np.float64(1),
                "Y": np.float64(0),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            distance=np.float64(10),
            max_speed=np.float64(1),
            blocks=(
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(1),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(1),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(1),
                    acceleration=np.float64(0),
                ),
            ),
        ),
        Move.build(
            unit_vector={
                "X": np.float64(0),
                "Y": np.float64(1),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            distance=np.float64(20),
            max_speed=np.float64(2),
            blocks=(
                Block(
                    distance=np.float64(20 / 3),
                    initial_speed=np.float64(2),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(20 / 3),
                    initial_speed=np.float64(2),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(20 / 3),
                    initial_speed=np.float64(2),
                    acceleration=np.float64(0),
                ),
            ),
        ),
        Move.build(
            unit_vector={
                "X": np.float64(0),
                "Y": np.float64(0),
                "Z": np.float64(1),
                "A": np.float64(0),
            },
            distance=np.float64(151),
            max_speed=np.float64(3),
            blocks=(
                Block(
                    distance=np.float64(151 / 3),
                    initial_speed=np.float64(3),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(151 / 3),
                    initial_speed=np.float64(3),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(151 / 3),
                    initial_speed=np.float64(3),
                    acceleration=np.float64(0),
                ),
            ),
        ),
        Move.build(
            unit_vector={
                "X": np.float64(0),
                "Y": np.float64(0),
                "Z": np.float64(0),
                "A": np.float64(1),
            },
            distance=np.float64(1255),
            max_speed=np.float64(4),
            blocks=(
                Block(
                    distance=np.float64(1255 / 3),
                    initial_speed=np.float64(4),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(1255 / 3),
                    initial_speed=np.float64(4),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(1255 / 3),
                    initial_speed=np.float64(4),
                    acceleration=np.float64(0),
                ),
            ),
        ),
    ]

    assert (
        list(
            targets_to_moves(
                {
                    "X": np.float64(0),
                    "Y": np.float64(0),
                    "Z": np.float64(0),
                    "A": np.float64(0),
                },
                targets,
            )
        )
        == expected
    )


@pytest.mark.parametrize(
    argnames=["prev_move", "unit_vector", "max_speed", "expected"],
    argvalues=[
        # previous move is not moving, use the smaller of move max speed and axis max
        # speed discontinuity
        [DUMMY_MOVE, [1, 0, 0, 0], 5, 5],
        [DUMMY_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS["X"].max_speed_discont],
        # previous move is moving in same direction as current move, use the smaller
        # of move max speed and axis max speed discontinuity
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 5, 5],
        [
            SIMPLE_FORWARD_MOVE,
            [1, 0, 0, 0],
            200,
            CONSTRAINTS["X"].max_speed_discont,
        ],
        # previous move is moving in opposite direction, use the smaller of move max
        # speed and axis max dir change speed discontinuity
        [
            SIMPLE_FORWARD_MOVE,
            [-1, 0, 0, 0],
            600,
            CONSTRAINTS["X"].max_direction_change_speed_discont,
        ],
        [SIMPLE_BACKWARD_MOVE, [1, 0, 0, 0], 455, 455],
    ],
)
def test_initial_speed(
    prev_move: Move[str],
    unit_vector: Iterator[np.float64],
    max_speed: float,
    expected: float,
) -> None:
    """It should find the correct initial speed of the move."""
    move = Move.build(
        unit_vector={k: v for k, v in zip(AXES, unit_vector)},
        distance=np.float64(100),
        max_speed=np.float64(max_speed),
        blocks=(
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
        ),
    )
    assert find_initial_speed(CONSTRAINTS, move, prev_move) == expected


@pytest.mark.parametrize(
    argnames=["next_move", "unit_vector", "max_speed", "expected"],
    argvalues=[
        # next move is not moving, use the smaller of move max speed and axis max
        # speed discontinuity
        [DUMMY_MOVE, [1, 0, 0, 0], 5, 5],
        [DUMMY_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS["X"].max_speed_discont],
        # next move is moving in same direction as current move, use the smaller
        # of move max speed and axis max speed discontinuity
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 5, 5],
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS["X"].max_speed_discont],
        # next move is moving in opposite direction, use the smaller of move max
        # speed and axis max direction change speed discontinuity
        [
            SIMPLE_FORWARD_MOVE,
            [-1, 0, 0, 0],
            600,
            CONSTRAINTS["X"].max_direction_change_speed_discont,
        ],
        [SIMPLE_BACKWARD_MOVE, [1, 0, 0, 0], 455, 455],
    ],
)
def test_final_speed(
    next_move: Move[str],
    unit_vector: Iterator[np.float64],
    max_speed: float,
    expected: float,
) -> None:
    """It should find the correct final speed of the move."""
    move = Move.build(
        unit_vector=dict(zip(AXES, unit_vector)),
        distance=np.float64(100),
        max_speed=np.float64(max_speed),
        blocks=(
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
            Block(
                distance=np.float64(100 / 3),
                initial_speed=np.float64(max_speed),
                acceleration=np.float64(0),
            ),
        ),
    )
    assert find_final_speed(CONSTRAINTS, move, next_move) == expected


def test_blend_motion() -> None:
    """Motion should blend."""
    manager = MoveManager(CONSTRAINTS)

    def all_zeros() -> Iterator[np.float64]:
        while True:
            yield np.float64(0)

    origin = dict(zip(SIXAXES, all_zeros()))
    target_list = [
        MoveTarget.build(
            position={
                "X": np.float64(10),
                "Y": np.float64(0),
                "Z": np.float64(0),
                "A": np.float64(0),
                "B": np.float64(0),
                "C": np.float64(0),
            },
            max_speed=np.float64(30),
        ),
        MoveTarget.build(
            position={
                "X": np.float64(10),
                "Y": np.float64(10),
                "Z": np.float64(0),
                "A": np.float64(0),
                "B": np.float64(0),
                "C": np.float64(0),
            },
            max_speed=np.float64(20),
        ),
        MoveTarget.build(
            position={
                "X": np.float64(10),
                "Y": np.float64(10),
                "Z": np.float64(15),
                "A": np.float64(10),
                "B": np.float64(0),
                "C": np.float64(0),
            },
            max_speed=np.float64(10),
        ),
    ]
    success, blend_log = manager.plan_motion(origin, target_list)
    assert success
    assert all_blended(CONSTRAINTS, blend_log[-1])


coords = st.lists(st.floats(min_value=0, max_value=1e64), min_size=4, max_size=4)


@given(coords, coords)
def test_get_unit_vector(x: List[float], y: List[float]) -> None:
    """Get unit vector function should return a unit vector."""
    assume(x != y)
    assume(all(abs(j - i) > FLOAT_THRESHOLD for i, j in zip(x, y)))
    coord_0 = dict(zip(AXES, (np.float64(i) for i in x)))
    coord_1 = dict(zip(AXES, (np.float64(i) for i in y)))
    unit_v, _ = get_unit_vector(coord_1, coord_0)
    assert is_unit_vector(unit_v)
