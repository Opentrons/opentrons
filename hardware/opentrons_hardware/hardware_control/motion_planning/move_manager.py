"""Move manager."""
import logging
from typing import List, Tuple

from opentrons_hardware.hardware_control.motion_planning import move_utils
from opentrons_hardware.hardware_control.motion_planning.types import (
    Coordinates,
    Move,
    MoveTarget,
    SystemConstraints,
)

log = logging.getLogger(__name__)


class MoveManager:
    """A manager that handles a list of moves for the hardware control system."""

    def __init__(self, constraints: SystemConstraints) -> None:
        """Constructor.

        Args:
            constraints: system contraints
        """
        self._constraints = constraints
        self._blend_log: List[List[Move]] = []

    def _clear_blend_log(self) -> None:
        """Empty the blend log."""
        self._blend_log = []

    def _get_initial_moves_from_targets(
        self, origin: Coordinates, target_list: List[MoveTarget]
    ) -> List[Move]:
        """Create a list of moves from the target list for blending."""
        initial_moves = list(move_utils.targets_to_moves(origin, target_list))
        return self._add_dummy_start_end_to_moves(initial_moves)

    def _add_dummy_start_end_to_moves(self, move_list: List[Move]) -> List[Move]:
        """Append dummy moves to the start and the end of the move list."""
        start_move = Move.build_dummy_move()
        end_move = Move.build_dummy_move()
        return [start_move] + move_list + [end_move]

    def plan_motion(
        self,
        origin: Coordinates,
        target_list: List[MoveTarget],
        iteration_limit: int = 10,
    ) -> Tuple[bool, List[List[Move]]]:
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
                log.info(
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
