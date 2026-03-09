"""Tests for move util functions."""
import pytest
import numpy as np
from typing import Iterator, List, Union
from hypothesis import given, strategies as st, assume

from opentrons_hardware.hardware_control.motion_planning.move_manager import MoveManager
from opentrons_hardware.hardware_control.motion_planning.move_utils import (
    find_initial_speed,
    find_final_speed,
    targets_to_moves,
    all_blended,
    get_unit_vector,
    FLOAT_THRESHOLD,
    limit_max_speed,
    split_unit_vector,
    de_diagonalize_unit_vector,
    MINIMUM_VECTOR_COMPONENT,
)
from opentrons_hardware.hardware_control.motion_planning.types import (
    AxisConstraints,
    Block,
    Move,
    MoveTarget,
    SystemConstraints,
    is_unit_vector,
    Coordinates,
)

AXES = ["X", "Y", "Z", "A"]
SIXAXES = ["X", "Y", "Z", "A", "B", "C"]

CONSTRAINTS: SystemConstraints[str] = {
    "X": AxisConstraints.build(
        max_acceleration=np.float64(10),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
    ),
    "Y": AxisConstraints.build(
        max_acceleration=np.float64(10),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
    ),
    "Z": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
    ),
    "A": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
    ),
    "B": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
    ),
    "C": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(100),
        max_direction_change_speed_discont=np.float64(500),
        max_speed=np.float64(500),
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
LIMIT_MAX_CONSTRAINTS: SystemConstraints[str] = {
    "X": AxisConstraints.build(
        max_acceleration=10,
        max_speed_discont=15,
        max_direction_change_speed_discont=500,
        max_speed=10,
    ),
    "Y": AxisConstraints.build(
        max_acceleration=10,
        max_speed_discont=15,
        max_direction_change_speed_discont=500,
        max_speed=500,
    ),
}


def uv_for_angle(angle: Union[float, np.float64]) -> Coordinates[str, np.float64]:
    """Calculate a 2d unit vector given an angle."""
    return {"X": np.cos(angle), "Y": np.sin(angle)}


@pytest.mark.parametrize(
    "unit_vector,linear_speed,limited_speed",
    [
        # untouched
        (uv_for_angle(0), 10, 10),
        (uv_for_angle(0), 9, 9),
        (uv_for_angle(np.pi), 9, 9),
        (uv_for_angle(np.pi / 2), 500, 500),
        (uv_for_angle(np.pi / 2), 499, 499),
        (uv_for_angle(-np.pi / 2), 499, 499),
        (
            uv_for_angle(np.pi / 4),
            10.0 / (np.sqrt(2) / 2),
            10.0 / (np.sqrt(2) / 2),
        ),
        (uv_for_angle(-np.pi / 4), 10.0 / (np.sqrt(2) / 2), 10.0 / (np.sqrt(2) / 2)),
        (
            uv_for_angle(3 * np.pi / 4),
            10.0 / (np.sqrt(2) / 2),
            10.0 / (np.sqrt(2) / 2),
        ),
        (
            uv_for_angle(-3 * np.pi / 4),
            10.0 / (np.sqrt(2) / 2),
            10.0 / (np.sqrt(2) / 2),
        ),
        (uv_for_angle(np.pi / 2 - 0.01), 498, 498),
        (uv_for_angle(-np.pi / 2 + 0.01), 498, 498),
        # limited by x
        (uv_for_angle(0), 100, 10),
        (uv_for_angle(np.pi), 100, 10),
        (uv_for_angle(np.pi / 4), 20.14, 10.0 / (np.sqrt(2) / 2.0)),
        # limited by y
        (uv_for_angle(np.pi / 2), 1000, 500),
        (uv_for_angle(-np.pi / 2), 1000, 500),
        # limited by both
        (uv_for_angle(np.pi / 2 - 0.01), 1100, 500.025),
    ],
)
def test_limit_max_speed(
    unit_vector: Coordinates[str, np.float64], linear_speed: float, limited_speed: float
) -> None:
    """It should limit a move's linear speed to match constraints."""
    assert limit_max_speed(
        unit_vector, np.float64(linear_speed), LIMIT_MAX_CONSTRAINTS
    ) == pytest.approx(np.float64(limited_speed))


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
            np.float64(1000),
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
            max_speed=np.float64(500),
            blocks=(
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(10 / 3),
                    initial_speed=np.float64(np.float64(500)),
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
                CONSTRAINTS,
            )
        )
        == expected
    )


def test_convert_targets_to_moves_de_diagonilization() -> None:
    """Test that conversion will split out problematic movements."""
    targets = [
        MoveTarget.build(
            {
                "X": np.float64(200),
                "Y": np.float64(0.1),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            np.float64(1000),
        ),
        MoveTarget.build(
            {
                "X": np.float64(200),
                "Y": np.float64(0),
                "Z": np.float64(200),
                "A": np.float64(0),
            },
            np.float64(1000),
        ),
    ]

    expected = [
        Move.build(
            unit_vector={
                "X": np.float64(0),
                "Y": np.float64(1),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            distance=np.float64(0.1),
            max_speed=np.float64(500),
            blocks=(
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
            ),
        ),
        Move.build(
            unit_vector={
                "X": np.float64(1),
                "Y": np.float64(0),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            distance=np.float64(200),
            max_speed=np.float64(500),
            blocks=(
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
            ),
        ),
        Move.build(
            unit_vector={
                "X": np.float64(0),
                "Y": np.float64(-1),
                "Z": np.float64(0),
                "A": np.float64(0),
            },
            distance=np.float64(0.1),
            max_speed=np.float64(500),
            blocks=(
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0.1 / 3),
                    initial_speed=np.float64(np.float64(500)),
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
            distance=np.float64(200),
            max_speed=np.float64(500),
            blocks=(
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(200 / 3),
                    initial_speed=np.float64(np.float64(500)),
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
                CONSTRAINTS,
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


def test_handle_rounding_error_when_calculating_block_final_speed() -> None:
    """Avoid rounding errors."""
    # these magic values below were found to create a NaN value for Block.final_speed
    # because of rounding errors. This should not happen.
    b = Block(
        initial_speed=499.99999999999994,
        acceleration=-3292.7694932142017,
        distance=37.961964922719986,
    )
    assert b.final_speed == 0
    assert b.time


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


def test_split_unit_vector() -> None:
    """Given a unit vector, be able to split it."""
    coord_0 = {
        "X": 0,
        "Y": 0,
        "Z": 0,
        "W": 0,
    }
    coord_1 = {
        "X": 100,
        "Y": -100,
        "Z": 25,
        "W": 0,
    }
    unit_v, dist = get_unit_vector(coord_0, coord_1)

    split_1, split_2 = split_unit_vector(unit_v, dist, "X")
    unit_1, dist_1 = split_1
    unit_2, dist_2 = split_2
    assert is_unit_vector(unit_1)
    assert is_unit_vector(unit_2)
    assert unit_1["X"] != np.float64(0)
    assert unit_2["X"] == np.float64(0)
    assert dist_1 == pytest.approx(np.float64(100))
    assert dist_1 != dist_2


def test_de_diagonalize_vectors() -> None:
    """Given a unit vector, split out small distances."""
    coord_0 = {
        "X": 0,
        "Y": 0,
        "Z": 0,
        "A": 0,
    }
    coord_1 = {
        "X": 100,
        "Y": -0.05,
        "Z": 25,
        "A": 0.07,
    }
    unit_v, dist = get_unit_vector(coord_0, coord_1)

    split = de_diagonalize_unit_vector(unit_v, dist, MINIMUM_VECTOR_COMPONENT)
    assert len(split) == 3

    y_v, y_dist = split[0]
    a_v, a_dist = split[1]
    long_v, long_dist = split[2]

    assert is_unit_vector(y_v)
    assert is_unit_vector(a_v)
    assert is_unit_vector(long_v)
    assert y_v["Y"] == pytest.approx(np.float64(-1))
    assert y_dist == pytest.approx(np.float64(0.05))
    assert a_dist == pytest.approx(np.float64(0.07))
    assert long_dist > y_dist
    assert y_v["Y"] == pytest.approx(np.float64(-1))
    assert a_v["A"] == pytest.approx(np.float64(1))
    assert long_v["Y"] == np.float64(0)
    assert long_v["A"] == np.float64(0)

    split_again = de_diagonalize_unit_vector(
        long_v, long_dist, MINIMUM_VECTOR_COMPONENT
    )
    assert len(split_again) == 1
    assert split_again[0] == (long_v, long_dist)


def test_triangle_matching() -> None:
    """Test that equal-endpoint triangle moves work.

    An equal-endpoint triangle move is a move that has the same initial
    and final velocities and reaches a third, higher, velocity in the middle.

    When we compute move internal acceleration, we compute the accelerating
    and decelerating legs first, trying to reach the highest velocity we can.
    If that requires us to move farther than the input move allows, we
    limit the max speed to the greater of the initial and final velocities -
    guaranteed to be <= the problematic velocity. But if the initial and
    final velocities are the same, the math gets thrown for a loop.

    That shouldn't happen for equal-endpoint triangle moves though - the
    conditions that create the overruns are very _inequal_ triangle moves.
    But with slight numerical inaccuracy, it can, and that's the problem.

    This test checks that equal-endpoint triangle moves do not have this
    problematic behavior on a typical infringing move seen in the wild.
    """
    problematic_constraints: SystemConstraints[str] = {
        "X": AxisConstraints.build(
            max_acceleration=np.float64(100),
            max_speed_discont=np.float64(40),
            max_direction_change_speed_discont=np.float64(20),
            max_speed=np.float64(500),
        ),
        "Y": AxisConstraints.build(
            max_acceleration=np.float64(100),
            max_speed_discont=np.float64(40),
            max_direction_change_speed_discont=np.float64(20),
            max_speed=np.float64(500),
        ),
        "Z": AxisConstraints.build(
            max_acceleration=np.float64(100),
            max_speed_discont=np.float64(40),
            max_direction_change_speed_discont=np.float64(20),
            max_speed=np.float64(500),
        ),
    }
    manager = MoveManager(problematic_constraints)
    blended, moves = manager.plan_motion(
        origin={
            "X": np.float64(261.077),
            "Y": np.float64(229.898),
            "Z": np.float64(0.0),
        },
        target_list=[
            MoveTarget(
                position={
                    "X": np.float64(261.105),
                    "Y": np.float64(229.925),
                    "Z": np.float64(149.80000000000004),
                },
                max_speed=np.float64(500),
            ),
        ],
    )
    assert len(moves) == 1 and len(moves[0]) == 1
    active_move = moves[0][0]
    # This should be an equal-leg triangle move, so
    # - there should be  no coast phase
    assert active_move.blocks[1].distance == 0
    assert active_move.blocks[1].time == 0
    # - the accelerate and decelerate legs should be equal
    assert active_move.blocks[0].distance != 0
    assert active_move.blocks[0].time != 0
    assert active_move.blocks[0].initial_speed != 0
    assert active_move.blocks[2].distance == active_move.blocks[0].distance
    assert active_move.blocks[2].time != active_move.blocks[0].time
    assert active_move.blocks[2].final_speed == pytest.approx(
        active_move.blocks[0].initial_speed
    )
    assert active_move.blocks[0].distance + active_move.blocks[
        2
    ].distance == pytest.approx(active_move.distance)
