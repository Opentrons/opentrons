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
    Axis,
    AxisConstraints,
    Block,
    Coordinates,
    Move,
    MoveTarget,
    AcceptableType,
    SystemConstraints,
)


CONSTRAINTS: SystemConstraints = {
    Axis.X: AxisConstraints.build(
        max_acceleration=10,
        max_speed_discont=15,
        max_direction_change_speed_discont=500,
    ),
    Axis.Y: AxisConstraints.build(
        max_acceleration=10,
        max_speed_discont=15,
        max_direction_change_speed_discont=500,
    ),
    Axis.Z: AxisConstraints.build(
        max_acceleration=100,
        max_speed_discont=100,
        max_direction_change_speed_discont=500,
    ),
    Axis.A: AxisConstraints.build(
        max_acceleration=100,
        max_speed_discont=100,
        max_direction_change_speed_discont=500,
    ),
}


SIMPLE_FORWARD_MOVE = Move.build(
    unit_vector=Coordinates(1, 0, 0, 0),
    distance=1,
    max_speed=1,
    blocks=(
        Block(distance=10, initial_speed=1, acceleration=0),
        Block(distance=10, initial_speed=1, acceleration=0),
        Block(distance=10, initial_speed=1, acceleration=0),
    ),
)

SIMPLE_BACKWARD_MOVE = Move.build(
    unit_vector=Coordinates(-1, 0, 0, 0),
    distance=1,
    max_speed=1,
    blocks=(
        Block(distance=10, initial_speed=1, acceleration=0),
        Block(distance=10, initial_speed=1, acceleration=0),
        Block(distance=10, initial_speed=1, acceleration=0),
    ),
)

DUMMY_MOVE = Move.build_dummy_move()


def test_convert_targets_to_moves() -> None:
    """It should convert a list of move targets into a list of moves."""
    targets = [
        MoveTarget.build(Coordinates(10, 0, 0, 0), 1),
        MoveTarget.build(Coordinates(10, 20, 0, 0), 2),
        MoveTarget.build(Coordinates(10, 20, 151, 0), 3),
        MoveTarget.build(Coordinates(10, 20, 151, 1255), 4),
    ]

    expected = [
        Move.build(
            unit_vector=Coordinates(1.0, 0.0, 0.0, 0.0),
            distance=10.0,
            max_speed=1,
            blocks=(
                Block(distance=10 / 3, initial_speed=1, acceleration=0),
                Block(distance=10 / 3, initial_speed=1, acceleration=0),
                Block(distance=10 / 3, initial_speed=1, acceleration=0),
            ),
        ),
        Move.build(
            unit_vector=Coordinates(0.0, 1.0, 0.0, 0.0),
            distance=20.0,
            max_speed=2,
            blocks=(
                Block(distance=20 / 3, initial_speed=2, acceleration=0),
                Block(distance=20 / 3, initial_speed=2, acceleration=0),
                Block(distance=20 / 3, initial_speed=2, acceleration=0),
            ),
        ),
        Move.build(
            unit_vector=Coordinates(0.0, 0.0, 1.0, 0.0),
            distance=151.0,
            max_speed=3,
            blocks=(
                Block(distance=151 / 3, initial_speed=3, acceleration=0),
                Block(distance=151 / 3, initial_speed=3, acceleration=0),
                Block(distance=151 / 3, initial_speed=3, acceleration=0),
            ),
        ),
        Move.build(
            unit_vector=Coordinates(0.0, 0.0, 0.0, 1.0),
            distance=1255.0,
            max_speed=4,
            blocks=(
                Block(distance=1255 / 3, initial_speed=4, acceleration=0),
                Block(distance=1255 / 3, initial_speed=4, acceleration=0),
                Block(distance=1255 / 3, initial_speed=4, acceleration=0),
            ),
        ),
    ]

    assert list(targets_to_moves(Coordinates(0, 0, 0, 0), targets)) == expected


@pytest.mark.parametrize(
    argnames=["prev_move", "unit_vector", "max_speed", "expected"],
    argvalues=[
        # previous move is not moving, use the smaller of move max speed and axis max
        # speed discontinuity
        [DUMMY_MOVE, [1, 0, 0, 0], 5, 5],
        [DUMMY_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS[Axis.X].max_speed_discont],
        # previous move is moving in same direction as current move, use the smaller
        # of move max speed and axis max speed discontinuity
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 5, 5],
        [
            SIMPLE_FORWARD_MOVE,
            [1, 0, 0, 0],
            200,
            CONSTRAINTS[Axis.X].max_speed_discont,
        ],
        # previous move is moving in opposite direction, use the smaller of move max
        # speed and axis max dir change speed discontinuity
        [
            SIMPLE_FORWARD_MOVE,
            [-1, 0, 0, 0],
            600,
            CONSTRAINTS[Axis.X].max_direction_change_speed_discont,
        ],
        [SIMPLE_BACKWARD_MOVE, [1, 0, 0, 0], 455, 455],
    ],
)
def test_initial_speed(
    prev_move: Move,
    unit_vector: Iterator[AcceptableType],
    max_speed: float,
    expected: float,
) -> None:
    """It should find the correct initial speed of the move."""
    move = Move.build(
        unit_vector=Coordinates.from_iter(unit_vector),
        distance=100,
        max_speed=max_speed,
        blocks=(
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
        ),
    )
    assert find_initial_speed(CONSTRAINTS, move, prev_move) == expected


@pytest.mark.parametrize(
    argnames=["next_move", "unit_vector", "max_speed", "expected"],
    argvalues=[
        # next move is not moving, use the smaller of move max speed and axis max
        # speed discontinuity
        [DUMMY_MOVE, [1, 0, 0, 0], 5, 5],
        [DUMMY_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS[Axis.X].max_speed_discont],
        # next move is moving in same direction as current move, use the smaller
        # of move max speed and axis max speed discontinuity
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 5, 5],
        [SIMPLE_FORWARD_MOVE, [1, 0, 0, 0], 200, CONSTRAINTS[Axis.X].max_speed_discont],
        # next move is moving in opposite direction, use the smaller of move max
        # speed and axis max direction change speed discontinuity
        [
            SIMPLE_FORWARD_MOVE,
            [-1, 0, 0, 0],
            600,
            CONSTRAINTS[Axis.X].max_direction_change_speed_discont,
        ],
        [SIMPLE_BACKWARD_MOVE, [1, 0, 0, 0], 455, 455],
    ],
)
def test_final_speed(
    next_move: Move,
    unit_vector: Iterator[AcceptableType],
    max_speed: float,
    expected: float,
) -> None:
    """It should find the correct final speed of the move."""
    move = Move.build(
        unit_vector=Coordinates.from_iter(unit_vector),
        distance=100,
        max_speed=max_speed,
        blocks=(
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
            Block(distance=100 / 3, initial_speed=max_speed, acceleration=0),
        ),
    )
    assert find_final_speed(CONSTRAINTS, move, next_move) == expected


def test_blend_motion() -> None:
    """Motion should blend."""
    manager = MoveManager(CONSTRAINTS)
    origin = Coordinates(0, 0, 0, 0)
    target_list = [
        MoveTarget.build(position=Coordinates(10, 0, 0, 0), max_speed=30),
        MoveTarget.build(position=Coordinates(10, 10, 0, 0), max_speed=20),
        MoveTarget.build(position=Coordinates(10, 10, 15, 10), max_speed=10),
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
    coord_0 = Coordinates.from_iter(np.float64(i) for i in x)
    coord_1 = Coordinates.from_iter(np.float64(i) for i in y)
    unit_v, _ = get_unit_vector(coord_1, coord_0)
    assert unit_v.is_unit_vector()
