"""Utils for motion planning."""
import numpy as np  # type: ignore[import]
import logging
from typing import Iterator, List, Tuple, cast

from opentrons_hardware.hardware_control.motion_planning.types import (
    Block,
    Coordinates,
    Move,
    MoveTarget,
    Axis,
    AxisConstraints,
    SystemConstraints,
)

log = logging.getLogger(__name__)


FLOAT_THRESHOLD = 0.001  # TODO: re-evaluate this value based on system limitations


def get_unit_vector(
    initial: Coordinates, target: Coordinates
) -> Tuple[Coordinates, np.float64]:
    """Get the unit vector and the distance the two coordinates."""
    initial_vectorized = initial.vectorize()
    target_vectorized = target.vectorize()
    displacement: np.ndarray = target_vectorized - initial_vectorized
    distance = np.linalg.norm(displacement)
    unit_vector = Coordinates.from_iter(displacement / distance)
    return unit_vector, distance


def targets_to_moves(initial: Coordinates, targets: List[MoveTarget]) -> Iterator[Move]:
    """Transform a list of MoveTargets into a list of Moves."""
    for target in targets:
        unit_vector, distance = get_unit_vector(initial, target.position)
        m = Move(
            unit_vector=unit_vector,
            distance=distance,
            max_speed=target.max_speed,
            blocks=(
                Block(distance=0, initial_speed=target.max_speed, acceleration=0),
                Block(distance=0, initial_speed=target.max_speed, acceleration=0),
                Block(distance=0, initial_speed=target.max_speed, acceleration=0),
            ),
        )
        log.debug(f"Built move from {initial} to {target} as {m}")
        yield m
        initial = target.position


def initial_speed_limit_from_axis(
    axis_constraints: AxisConstraints,
    axis_component: np.float64,
    prev_component: np.float64,
    prev_final_speed: np.float64,
) -> np.float64:
    """Compute the initial move speed limit for an axis."""
    if not prev_component or prev_final_speed == 0:
        # If we're previously stopped, we can use maximum speed
        # discontinuity to start
        log.debug("started from 0, using max speed dc")
        return axis_constraints.max_speed_discont / axis_component

    if prev_component * axis_component > 0:
        # If we're moving the same direction as the previous move we have a
        # chance to remain going nice and fast. We should try and start at
        # its final speed, or - if its final speed is under the discontinuity speed

        prev_axis_final_speed = abs(prev_final_speed * prev_component)
        prev_axis_constrained_speed = np.maximum(
            prev_axis_final_speed, axis_constraints.max_speed_discont
        )
        log.debug(
            f"starting from same-dir, using {prev_axis_constrained_speed} "
            f"from prev final {prev_axis_final_speed} and dc "
            f"{axis_constraints.max_speed_discont}"
        )
        return abs(prev_axis_constrained_speed / axis_component)

    if prev_component * axis_component < 0:
        # If we are changing directions, we should start at our direction-change
        # discontinuity speed
        log.debug("changed direction, using change discont")
        return abs(axis_constraints.max_direction_change_speed_discont / axis_component)
    else:
        assert False, "planning initial speed failed"


def find_initial_speed(
    constraints: SystemConstraints, move: Move, prev_move: Move
) -> np.float64:
    """Get a move's initial speed."""
    # Figure out how fast we can be going when we start
    initial_speed: np.float64 = move.max_speed

    for axis in Axis.get_all_axes():

        log.debug(f"Find initial speed for {axis}")
        axis_component = move.unit_vector[axis]
        axis_constraints = constraints[axis]
        prev_component = (
            prev_move.unit_vector[axis]
            if prev_move.distance > FLOAT_THRESHOLD
            else np.float64(0)
        )
        prev_final_speed = prev_move.final_speed

        if abs(axis_component) < FLOAT_THRESHOLD:
            log.debug(f"Skip {axis} because it is not moving")
            continue
        else:
            # find speed limit per axis
            axis_constrained_speed = initial_speed_limit_from_axis(
                axis_constraints, axis_component, prev_component, prev_final_speed
            )

        initial_speed = np.minimum(axis_constrained_speed, initial_speed)

    log.debug(f"Initial speed: {initial_speed}")
    return initial_speed


def final_speed_limit_from_axis(
    axis_constraints: AxisConstraints,
    axis_component: np.float64,
    next_component: np.float64,
    next_initial_speed: np.float64,
) -> np.float64:
    """Compute the final speed limit for an axis."""
    if not next_component or next_initial_speed == 0:
        # if we're stopping, we can stop from our speed discontinuity
        log.debug("stopping, using max speed dc")
        return axis_constraints.max_speed_discont / axis_component

    elif next_component * axis_component > 0:
        # If we're continuing in the same direction, then we should try to go as
        # fast as we can. The subsequent move is going to try to make its initial
        # speed match ours if possible, so we should use the larger of its initial
        # speed or the discontinuity
        next_axis_initial_speed = abs(next_initial_speed * next_component)
        next_axis_constrained_speed = np.maximum(
            axis_constraints.max_speed_discont, next_axis_initial_speed
        )
        log.debug(
            f"same dir, using {next_axis_constrained_speed} "
            f"from next initial {next_axis_initial_speed} and dc "
            f"{axis_constraints.max_speed_discont}"
        )
        return abs(next_axis_constrained_speed / axis_component)

    elif next_component * axis_component < 0:
        # if we're changing direction, then we should prepare ourselves
        log.debug("changed direction")
        return abs(axis_constraints.max_direction_change_speed_discont / axis_component)
    else:
        assert False, "planning final speed failed"


def find_final_speed(
    constraints: SystemConstraints,
    move: Move,
    next_move: Move,
) -> np.float64:
    """Get a move's final speed."""
    # Figure out how fast we can be going when we stop
    final_speed: np.float64 = move.max_speed
    log = logging.getLogger("find_final_speed")

    for axis in Axis.get_all_axes():
        log.debug(f"Find final speed for {axis}")
        axis_component = move.unit_vector[axis]
        axis_constraints = constraints[axis]
        next_component = (
            next_move.unit_vector[axis]
            if next_move.distance > FLOAT_THRESHOLD
            else np.float64(0)
        )
        next_initial_speed = next_move.initial_speed

        if abs(axis_component) < FLOAT_THRESHOLD:
            log.debug(f"Skip {axis} because it is not moving")
            continue
        else:
            axis_speed_limit = final_speed_limit_from_axis(
                axis_constraints, axis_component, next_component, next_initial_speed
            )

        final_speed = np.minimum(axis_speed_limit, final_speed)

    log.debug(f"Final speed: {final_speed}")
    return final_speed


def achievable_final(
    constraints: SystemConstraints,
    move: Move,
    initial_speed: np.float64,
    final_speed: np.float64,
) -> np.float64:
    """Make sure the calculated final speed is achievable."""
    # Figure out whether this final speed is in fact achievable from the initial speed
    # in the distance allowed

    for axis in Axis.get_all_axes():
        axis_component = move.unit_vector[axis]
        if axis_component:
            axis_max_acc = constraints[axis].max_acceleration
            # using the equation v_f^2  = v_i^2 + 2as
            max_axis_final_velocity_sq = (
                initial_speed * axis_component
            ) ** 2 + 2 * axis_max_acc * move.distance
            # max_axis_final_velocity_sq = 2 * axis_max_acc * move.distance
            max_axis_final_velocity = (
                np.copysign(
                    np.sqrt(max_axis_final_velocity_sq) / axis_component,
                    final_speed - initial_speed,
                )
                + initial_speed
            )
            # take the smaller of the aboslute value
            final_speed = np.where(
                abs(max_axis_final_velocity) <= abs(final_speed),
                max_axis_final_velocity,
                final_speed,
            )

    return final_speed


def build_blocks(
    unit_vector: Coordinates,
    initial_speed: np.float64,
    final_speed: np.float64,
    distance: np.float64,
    max_speed: np.float64,
    constraints: SystemConstraints,
) -> Tuple[Block, Block, Block]:
    """Build blocks for a move.

    Build the blocks of a move that will be the fastest way to execute a move of
    specified displacement if we
    - never exceed our maximum speed
    - have at most one constant acceleration phase from our initial speed
    - have at most one constant deceleration phase to meet our final speed
    - have at most one 0 acceleration coast phase at our max speed
    """
    log = logging.getLogger("build_blocks")
    assert initial_speed <= max_speed, "check preconstraints for initial speed"
    assert final_speed <= max_speed, "check preconstraints for final speed"

    constraint_max_speed = max_speed
    max_acc = np.array(
        [constraints[axis].max_acceleration for axis in Axis.get_all_axes()]
    )
    max_acc_magnitude = np.linalg.norm(max_acc)
    acc_v = max_acc_magnitude * unit_vector.vectorize()

    for a_i, max_acc_i in zip(acc_v, max_acc):
        if abs(a_i) > max_acc_i:
            acc_v *= max_acc_i / a_i
    max_acceleration = np.linalg.norm(acc_v)

    initial_speed_sq = initial_speed ** 2
    final_speed_sq = final_speed ** 2

    max_achievable_speed = np.sqrt(
        0.5 * (2 * max_acceleration * distance + initial_speed_sq + final_speed_sq)
    )
    max_speed = np.minimum(max_achievable_speed, max_speed)
    max_speed_sq = max_speed ** 2

    log.debug(
        f"build blocks: {initial_speed} mm/s to {final_speed} mm/s in {distance} mm "
        f"with {max_acceleration} mm/s2 max a "
        f"gives {max_achievable_speed} mm/s limited to {max_speed} mm/s"
    )

    first = Block(
        initial_speed=initial_speed,
        acceleration=max_acceleration,
        distance=abs(max_speed_sq - initial_speed_sq) / (2 * max_acceleration),
    )

    final = Block(
        initial_speed=first.final_speed,
        acceleration=-max_acceleration,
        distance=abs(max_speed_sq - final_speed_sq) / (2 * max_acceleration),
    )

    if max_achievable_speed > constraint_max_speed:
        # we'll have a coast phase!
        assert distance - first.distance - final.distance > 0, (
            f"bad coast phase detection: total {distance}, first {first.distance}, "
            f"final {final.distance} "
        )
        coast = Block(
            initial_speed=final.initial_speed,
            acceleration=0,
            distance=distance - first.distance - final.distance,
        )
        return first, coast, final
    else:
        # no coast phase for us
        return first, Block(0, 0, 0), final


def build_move(
    move: Move,
    prev_move: Move,
    next_move: Move,
    constraints: SystemConstraints,
) -> Move:
    """Build a move."""
    log.debug(f"Build move: {move}")
    initial_speed = find_initial_speed(constraints, move, prev_move)
    final_speed = find_final_speed(constraints, move, next_move)
    final_speed = achievable_final(constraints, move, initial_speed, final_speed)

    m = Move(
        unit_vector=move.unit_vector,
        distance=move.distance,
        max_speed=move.max_speed,
        blocks=build_blocks(
            move.unit_vector,
            initial_speed,
            final_speed,
            move.distance,
            move.max_speed,
            constraints,
        ),
    )
    log.debug(f"applied constraints to {move} generating {m}")
    return m


def blended(constraints: SystemConstraints, first: Move, second: Move) -> bool:
    """Check if the moves are blended."""
    # have these actually had their blocks built?
    if sum(b.distance for b in first.blocks) != first.distance:
        return False
    if sum(b.distance for b in second.blocks) != second.distance:
        return False
    # do their junction velocities match constraints?

    for axis in Axis.get_all_axes():
        final_speed = abs(first.blocks[-1].final_speed * first.unit_vector[axis])
        initial_speed = abs(second.blocks[0].initial_speed * second.unit_vector[axis])
        if first.unit_vector[axis] * second.unit_vector[axis] > 0:
            # if they're in the same direction, we can check that either the junction
            # speeds exactly match, or that they're both under the discontinuity limit
            if final_speed <= constraints[axis].max_speed_discont:
                return cast(bool, initial_speed <= constraints[axis].max_speed_discont)
            else:
                return cast(bool, abs(initial_speed - final_speed) < FLOAT_THRESHOLD)
        else:
            # if they're in different directions, then the junction has to be at or
            # under the speed change discontinuity
            return cast(
                bool,
                final_speed <= constraints[axis].max_direction_change_speed_discont
                and initial_speed
                <= constraints[axis].max_direction_change_speed_discont,
            )
    log.debug("Not blending")
    return False


def all_blended(constraints: SystemConstraints, moves: List[Move]) -> bool:
    """Check if the moves in the list are all blended."""
    moveiter = iter(moves)
    prev = next(moveiter)
    while True:
        try:
            current = next(moveiter)
            if not blended(constraints, prev, current):
                return False
            prev = current
        except StopIteration:
            return True
