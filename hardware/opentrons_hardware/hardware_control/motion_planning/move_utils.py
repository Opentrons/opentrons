"""Utils for motion planning."""
import math
import numpy as np
import numpy.typing as npt
import logging
from typing import Iterator, List, Optional, Tuple

from opentrons_hardware.hardware_control.motion_planning.types import (
    Block,
    Coordinates,
    Move,
    MoveTarget,
    Axis,
    SystemConstraints,
)

log = logging.getLogger(__name__)


def create_dummy_move() -> Move:
    """Create a move without real data."""
    return Move(
        unit_vector=Coordinates(0, 0, 0, 0),
        distance=0,
        max_speed=0,
        blocks=(
            Block(distance=0, initial_speed=0, acceleration=0),
            Block(distance=0, initial_speed=0, acceleration=0),
            Block(distance=0, initial_speed=0, acceleration=0),
        ),
    )


def get_unit_vector(
    initial: Coordinates, target: Coordinates
) -> Tuple[Coordinates, float]:
    """Get the unit vector and the distance the two coordinates."""
    displacement: npt.NDArray[np.float64] = target.vectorize() - initial.vectorize()
    distance = np.linalg.norm(displacement)  # type: ignore[no-untyped-call]
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


def find_initial_speed(
    constraints: SystemConstraints, move: Move, prev_move: Optional[Move]
) -> float:
    """Get a move's initial speed."""
    # Figure out how fast we can be going when we start
    initial_speed: float = move.max_speed

    for axis in Axis.get_all_axes():

        log.debug(f"Find initial speed for {axis}")
        axis_component = move.unit_vector[axis.value]
        axis_constraints = constraints[axis]

        if not axis_component:
            log.debug(f"Skip {axis} because it is not moving")
            continue

        elif (
            not prev_move or not prev_move.unit_vector[axis.value]
        ) or prev_move.final_speed == 0:
            # If we're previously stopped, we can use maximum speed
            # discontinuity to start
            log.debug("started from 0, using max speed dc")
            axis_speed_limit = axis_constraints.max_speed_discont / axis_component

        elif prev_move.unit_vector[axis.value] * axis_component > 0:
            # If we're moving the same direction as the previous move we have a
            # chance to remain going nice and fast. We should try and start at
            # its final speed, or - if its final speed is under the discontinuity speed

            previous_axis_final_speed = abs(
                prev_move.final_speed * prev_move.unit_vector[axis.value]
            )
            axis_initial_limit = max(
                previous_axis_final_speed, axis_constraints.max_speed_discont
            )
            axis_speed_limit = abs(axis_initial_limit / axis_component)
            log.debug(
                f"starting from same-dir, using {initial_speed} "
                f"from prev final {previous_axis_final_speed} and dc "
                f"{axis_constraints.max_speed_discont}"
            )

        elif prev_move.unit_vector[axis.value] * axis_component < 0:
            # If we are changing directions, we should start at our direction-change
            # discontinuity speed
            axis_speed_limit = abs(
                axis_constraints.max_direction_change_speed_discont / axis_component
            )
            log.debug("changed direction, using change discont")

        else:
            assert False, "planning initial speed failed"

        initial_speed = min(axis_speed_limit, initial_speed)

    log.debug(f"Initial speed: {initial_speed}")
    return initial_speed


def find_final_speed(
    constraints: SystemConstraints,
    move: Move,
    next_move: Optional[Move],
) -> float:
    """Get a move's final speed."""
    # Figure out how fast we can be going when we stop
    final_speed: float = move.max_speed
    log = logging.getLogger("find_final_speed")

    for axis in Axis.get_all_axes():
        log.debug(f"Find final speed for {axis}")
        axis_component = move.unit_vector[axis.value]
        axis_constraints = constraints[axis]

        if not axis_component:
            log.debug(f"Skip {axis} because it is not moving")
            continue

        elif (
            not next_move
            or not next_move.unit_vector[axis.value]
            or next_move.initial_speed == 0
        ):
            # if we're stopping, we can stop from our speed discontinuity
            log.debug("stopping, using max speed dc")
            axis_speed_limit = axis_constraints.max_speed_discont / axis_component

        elif next_move.unit_vector[axis.value] * axis_component > 0:
            # If we're continuing in the same direction, then we should try to go as
            # fast as we can. The subsequent move is going to try to make its initial
            # speed match ours if possible, so we should use the larger of its initial
            # speed or the discontinuity
            next_initial_speed = abs(
                next_move.initial_speed * next_move.unit_vector[axis.value]
            )
            axis_initial_limit = max(
                axis_constraints.max_speed_discont, next_initial_speed
            )
            axis_speed_limit = abs(axis_initial_limit / axis_component)

            log.debug(
                f"same dir, using axis speed {axis_speed_limit} from next move"
                f"{next_initial_speed}"
            )

        elif next_move.unit_vector[axis.value] * axis_component < 0:
            # if we're changing direction, then we should prepare ourselves
            log.debug("changed direction")
            axis_speed_limit = abs(
                axis_constraints.max_direction_change_speed_discont / axis_component
            )
        else:
            assert False, "planning final speed failed"

        final_speed = min(axis_speed_limit, final_speed)

    log.debug(f"Final speed: {final_speed}")
    return final_speed


def achievable_final(
    constraints: SystemConstraints,
    move: Move,
    initial_speed: float,
    final_speed: float,
) -> float:
    """Make sure the calculated final speed is achievable."""
    # Figure out whether this final speed is in fact achievable from the initial speed
    # in the distance allowed

    for axis in Axis.get_all_axes():
        axis_component = move.unit_vector[axis.value]
        if axis_component:
            axis_max_acc = constraints[axis].max_acceleration
            # using the equation v_f^2  = v_i^2 + 2as
            max_axis_final_velocity_sq = (
                initial_speed * axis_component
            ) ** 2 + 2 * axis_max_acc * move.distance
            # max_axis_final_velocity_sq = 2 * axis_max_acc * move.distance
            max_axis_final_velocity = (
                math.copysign(
                    math.sqrt(max_axis_final_velocity_sq) / axis_component,
                    final_speed - initial_speed,
                )
                + initial_speed
            )
            final_speed = min(max_axis_final_velocity, final_speed, key=abs)

    return final_speed


def build_blocks(
    unit_vector: Coordinates,
    initial_speed: float,
    final_speed: float,
    distance: float,
    max_speed: float,
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
    max_acc_magnitude = np.linalg.norm(max_acc)  # type: ignore[no-untyped-call]
    acc_v = max_acc_magnitude * unit_vector.vectorize()

    for a_i, max_acc_i in zip(acc_v, max_acc):
        if abs(a_i) > max_acc_i:
            acc_v *= max_acc_i / a_i
    max_acceleration = np.linalg.norm(acc_v)  # type: ignore[no-untyped-call]

    initial_speed_sq = initial_speed ** 2
    final_speed_sq = final_speed ** 2

    max_achievable_speed = math.sqrt(
        0.5 * (2 * max_acceleration * distance + initial_speed_sq + final_speed_sq)
    )
    max_speed = min(max_achievable_speed, max_speed)
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
        return (first, coast, final)
    else:
        # no coast phase for us
        return (first, Block(0, 0, 0), final)


def build_move(
    move: Move,
    prev_move: Optional[Move],
    next_move: Optional[Move],
    constraints: SystemConstraints,
) -> Move:
    """Build a move."""
    initial_speed = find_initial_speed(constraints, move, prev_move)
    final_speed = find_final_speed(constraints, move, next_move)
    final_speed = achievable_final(constraints, move, initial_speed, final_speed)

    m = Move(
        move.unit_vector,
        move.distance,
        move.max_speed,
        build_blocks(
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
        final_speed = abs(first.blocks[-1].final_speed * first.unit_vector[axis.value])
        initial_speed = abs(
            second.blocks[0].initial_speed * second.unit_vector[axis.value]
        )
        if first.unit_vector[axis.value] * second.unit_vector[axis.value] > 0:
            # if they're in the same direction, we can check that either the junction
            # speeds exactly match, or that they're both under the discontinuity limit
            if final_speed <= constraints[axis].max_speed_discont:
                return initial_speed <= constraints[axis].max_speed_discont
            else:
                return initial_speed == final_speed
        else:
            # if they're in different directions, then the junction has to be at or
            # under the speed change discontinuity
            return (
                final_speed <= constraints[axis].max_direction_change_speed_discont
                and initial_speed
                <= constraints[axis].max_direction_change_speed_discont
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
