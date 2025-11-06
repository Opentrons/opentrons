"""Move manager."""
import logging
from typing import List, Tuple, Generic, Set, Dict
from opentrons_hardware.hardware_control.motion_planning import move_utils
from opentrons_hardware.hardware_control.motion_planning.types import (
    Coordinates,
    Move,
    MoveTarget,
    SystemConstraints,
    AxisKey,
    CoordinateValue,
)
from opentrons_hardware.hardware_control.motion import MoveGroup
from opentrons_hardware.firmware_bindings.constants import NodeId
from numpy import isclose
import math

log = logging.getLogger(__name__)


class MoveManager(Generic[AxisKey]):
    """A manager that handles a list of moves for the hardware control system."""

    def __init__(self, constraints: SystemConstraints[AxisKey]) -> None:
        """Constructor.

        Args:
            constraints: system contraints
        """
        self._constraints = constraints
        self._blend_log: List[List[Move[AxisKey]]] = []

    def update_constraints(self, constraints: SystemConstraints[AxisKey]) -> None:
        """Update system constraints when instruments are changed."""
        self._constraints = constraints

    def get_constraints(self) -> SystemConstraints[AxisKey]:
        """Retrieve current system constraints."""
        return self._constraints

    def _clear_blend_log(self) -> None:
        """Empty the blend log."""
        self._blend_log = []

    def _get_initial_moves_from_targets(
        self,
        origin: Coordinates[AxisKey, CoordinateValue],
        target_list: List[MoveTarget[AxisKey]],
    ) -> List[Move[AxisKey]]:
        """Create a list of moves from the target list for blending."""
        initial_moves = list(
            move_utils.targets_to_moves(origin, target_list, self._constraints)
        )
        return self._add_dummy_start_end_to_moves(initial_moves)

    def _add_dummy_start_end_to_moves(
        self, move_list: List[Move[AxisKey]]
    ) -> List[Move[AxisKey]]:
        """Append dummy moves to the start and the end of the move list."""
        start_move = Move.build_dummy(move_list[0].unit_vector.keys())
        end_move = Move.build_dummy(move_list[0].unit_vector.keys())
        return [start_move] + move_list + [end_move]

    def devectorize_axes(
        self,
        origin: Coordinates[AxisKey, CoordinateValue],
        target: Coordinates[AxisKey, CoordinateValue],
        speed: float,
        axes: List[AxisKey],
    ) -> MoveTarget[AxisKey]:
        """This helper method is used when a plunger is moving in conjunction with other axis.

        It adjusts the speed by multiplying it by the inverse of the plunger's unit vector.
        If only the plunger is moving, this will just result in the speed being multiplied by 1
        and if there is more axes moving the 'speed' argument will be increased in such a way that
        the plunger will have the speed specified by the speed argument once the target is created.
        """
        move_target = MoveTarget.build(position=target, max_speed=speed)  # type: ignore[type-var]
        move_info = self._get_initial_moves_from_targets(origin, [move_target])[1]
        target_axes = move_info.unit_vector.keys()
        for axis in axes:
            if axis in target_axes:
                move_target = MoveTarget.build(  # type: ignore[type-var]
                    position=target,
                    max_speed=float(speed * (1 / move_info.unit_vector[axis].item())),
                )
        return move_target

    def ensure_pipette_flow_rate_unchanged(
        self,
        moving_axes: Set[AxisKey],
        origin: Dict[AxisKey, float],
        target: Dict[AxisKey, float],
        speed: float,
        move_group: MoveGroup,
        plunger_axes: List[Tuple[AxisKey, NodeId]],
    ) -> Tuple[bool, str]:
        """This examines the move group created to see if the plunger's speed is being reduced."""
        for axis, node in plunger_axes:
            if axis in moving_axes:
                pip_constraints = self.get_constraints()[axis]
                max_speed = pip_constraints.max_speed
                check_speed = speed
                if speed > max_speed:
                    # if we've commanded an arbitrarily high speed drop it to the max speed.
                    check_speed = max_speed.item()
                pip_distance = abs(target[axis] - origin[axis])
                # check to see if we can actually achieve this speed.
                acceleration_time = (
                    pip_constraints.max_speed - pip_constraints.max_speed_discont
                ) / pip_constraints.max_acceleration
                acceleration_distance = (
                    pip_constraints.max_speed_discont * acceleration_time
                    + 0.5 * pip_constraints.max_acceleration * (acceleration_time**2)
                )
                if 2 * acceleration_distance > pip_distance:
                    # distance commanded is too short to achieve commanded speed drop the check speed
                    # to as fast as it can do in that distance
                    # V_max = sqrt(2 * Accel * d_accel_phase + discontinuity^2)
                    check_speed = math.sqrt(
                        2 * pip_constraints.max_acceleration * pip_distance / 2
                        + pip_constraints.max_speed_discont**2
                    )
                pipette_speed = 0.0
                # Iterate through the move group and find the top speed.
                for step in move_group:
                    pipette_speed = max(pipette_speed, step[node].velocity_mm_sec.item())  # type: ignore [union-attr]
                if not isclose(pipette_speed, check_speed):
                    return (
                        True,
                        f"Slowing down the plunger flow rate, commanded speed {check_speed} actual speed {pipette_speed}",
                    )
        return (False, "")

    def plan_motion(
        self,
        origin: Coordinates[AxisKey, CoordinateValue],
        target_list: List[MoveTarget[AxisKey]],
        iteration_limit: int = 10,
    ) -> Tuple[bool, List[List[Move[AxisKey]]]]:
        """Create and blend moves from targets."""
        self._clear_blend_log()
        to_blend = self._get_initial_moves_from_targets(origin, target_list)
        assert to_blend, "Check target list"
        for i in range(iteration_limit):
            log.debug(f"Motion blending iteration: {i}")
            blend_log = []
            moveiter = iter(to_blend)
            first = next(moveiter)
            middle = next(moveiter)
            while True:
                try:
                    last = next(moveiter)
                    blend_log.append(
                        move_utils.build_move(middle, first, last, self._constraints)
                    )
                    first = middle
                    middle = last
                except StopIteration:
                    if blend_log:
                        self._blend_log.append(blend_log)
                    break
            if move_utils.all_blended(self._constraints, self._blend_log[i]):
                log.debug(
                    f"built {len(self._blend_log[i])} moves with "
                    f"{sum(list(m.nonzero_blocks for m in self._blend_log[i]))} "
                    f"non-zero blocks after {i+1} iteration(s)"
                )
                return True, self._blend_log
            else:
                self._blend_log[i] = self._add_dummy_start_end_to_moves(
                    self._blend_log[i]
                )
                to_blend = self._blend_log[-1]
        log.error("Could not converge!")
        return False, self._blend_log
