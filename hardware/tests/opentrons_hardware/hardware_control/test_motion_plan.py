"""Tests for motion planning."""
import numpy as np  # type: ignore[import]
from hypothesis import given, assume, strategies as st
from hypothesis.extra import numpy as hynp
from typing import Iterator, List

from opentrons_hardware.hardware_control.motion_planning import move_manager
from opentrons_hardware.hardware_control.motion_planning.types import (
    Axis,
    AxisConstraints,
    Coordinates,
    MoveTarget,
)


@st.composite
def generate_axis_constraint(draw: st.DrawFn) -> AxisConstraints:
    """Create axis constraint using Hypothesis."""
    acc = draw(st.integers(min_value=500, max_value=5000))
    speed_dist = draw(st.integers(min_value=100, max_value=500))
    dir_change_dist = draw(st.integers(min_value=10, max_value=100))
    assume(speed_dist > dir_change_dist)
    return AxisConstraints.build(
        max_acceleration=acc,
        max_speed_discont=speed_dist,
        max_direction_change_speed_discont=dir_change_dist,
    )


@st.composite
def generate_coordinates(draw: st.DrawFn) -> Coordinates:
    """Create coordinates using Hypothesis."""
    coord = [
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0, max_value=500)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0, max_value=490)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0, max_value=300)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0, max_value=300)),
    ]
    formatted: Iterator[np.float64] = (np.float64(i) for i in coord)
    return Coordinates.from_iter(formatted)


@st.composite
def generate_close_coordinates(draw: st.DrawFn, prev_coord: Coordinates) -> Coordinates:
    """Create coordinates using Hypothesis."""
    diff = [
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0.1, max_value=1.0)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0.1, max_value=1.0)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0.1, max_value=1.0)),
        draw(hynp.from_dtype(np.dtype(np.float64), min_value=0.1, max_value=1.0)),
    ]
    coord = prev_coord.vectorize() + diff
    formatted: Iterator[np.float64] = (np.float64(i) for i in coord)
    return Coordinates.from_iter(formatted)


def reject_close_coordinates(a: Coordinates, b: Coordinates) -> bool:
    """Reject example if the coordinates are too close.

    Consecutive coordinates must be at least 1mm apart in one of the axes.
    """
    return any(abs(b.vectorize() - a.vectorize()) > 1.0)


@st.composite
def generate_target_list(
    draw: st.DrawFn, elements: st.SearchStrategy[Coordinates] = generate_coordinates()
) -> List[MoveTarget]:
    """Generate a list of MoveTarget using Hypothesis."""
    target_num = draw(st.integers(min_value=1, max_value=10))
    target_list: List[MoveTarget] = []
    while len(target_list) < target_num:
        position = draw(elements)
        if len(target_list):
            assume(reject_close_coordinates(position, target_list[-1].position))
        target = MoveTarget.build(
            position, draw(st.floats(min_value=10, max_value=500))
        )
        target_list.append(target)
    return target_list


@st.composite
def generate_close_target_list(
    draw: st.DrawFn, origin: Coordinates
) -> List[MoveTarget]:
    """Generate a list of MoveTarget using Hypothesis."""
    target_num = draw(st.integers(min_value=1, max_value=10))
    target_list: List[MoveTarget] = []
    prev_coord = origin
    while len(target_list) < target_num:
        position = draw(generate_close_coordinates(prev_coord))
        target = MoveTarget.build(
            position, draw(st.floats(min_value=0.1, max_value=10.0))
        )
        target_list.append(target)
        prev_coord = position
    return target_list


@given(
    x_constraint=generate_axis_constraint(),
    y_constraint=generate_axis_constraint(),
    z_constraint=generate_axis_constraint(),
    a_constraint=generate_axis_constraint(),
    origin=generate_coordinates(),
    targets=generate_target_list(),
)
def test_move_plan(
    x_constraint: AxisConstraints,
    y_constraint: AxisConstraints,
    z_constraint: AxisConstraints,
    a_constraint: AxisConstraints,
    origin: Coordinates,
    targets: List[MoveTarget],
) -> None:
    """Test motion plan using Hypothesis."""
    assume(reject_close_coordinates(origin, targets[0].position))
    constraints = {
        Axis.X: x_constraint,
        Axis.Y: y_constraint,
        Axis.Z: z_constraint,
        Axis.A: a_constraint,
    }
    manager = move_manager.MoveManager(constraints=constraints)
    converged, blend_log = manager.plan_motion(
        origin=origin,
        target_list=targets,
        iteration_limit=5,
    )

    assert converged


@given(
    x_constraint=generate_axis_constraint(),
    y_constraint=generate_axis_constraint(),
    z_constraint=generate_axis_constraint(),
    a_constraint=generate_axis_constraint(),
    origin=generate_coordinates(),
    data=st.data(),
)
def test_close_move_plan(
    x_constraint: AxisConstraints,
    y_constraint: AxisConstraints,
    z_constraint: AxisConstraints,
    a_constraint: AxisConstraints,
    origin: Coordinates,
    data: st.DataObject,
) -> None:
    """Test motion plan using Hypothesis."""
    targets = data.draw(generate_close_target_list(origin))
    constraints = {
        Axis.X: x_constraint,
        Axis.Y: y_constraint,
        Axis.Z: z_constraint,
        Axis.A: a_constraint,
    }
    manager = move_manager.MoveManager(constraints=constraints)
    converged, blend_log = manager.plan_motion(
        origin=origin,
        target_list=targets,
        iteration_limit=5,
    )

    assert converged
