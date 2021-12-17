"""Move manager."""
import logging
from typing import List, Optional, Tuple

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

    def __init__(
        self,
        constraints: SystemConstraints,
        origin: Optional[Coordinates] = None,
        target_list: List[MoveTarget] = [],
        move_list: List[Move] = [],
    ) -> None:
        """Constructor.

        Args:
            constraints: system contraints
            origin: the coordinates for the beginning of the moves
            target_list: a list of targets for the system to move to
            move_list: a list of moves
        """
        self._constraints = constraints
        self._origin = origin
        self._targets = target_list
        self._moves = move_list
        self._blend_log: List[List[Move]] = []

    def _clear_moves(self) -> None:
        """Empty the move list."""
        self._moves = []

    def _clear_targets(self) -> None:
        """Empty the target list."""
        self._targets = []

    def _clear_blend_log(self) -> None:
        """Empty the blend log."""
        self._blend_log = []

    def reset(self) -> None:
        """Reset the move manager."""
        self._origin = None
        self._clear_moves()
        self._clear_targets()
        self._clear_blend_log()

    def set_origin(self, origin: Coordinates) -> None:
        """Set an origin for the moves."""
        self._origin = origin

    def add_targets(self, target_list: List[MoveTarget]) -> None:
        """Append targets to target list."""
        self._targets.extend(target_list)

    def _get_initial_moves_from_targets(self) -> List[Move]:
        """Create a list of moves from the target list for blending."""
        if not self._origin:
            raise ValueError("Cannot create moves without an origin")
        if not self._targets:
            raise ValueError("Cannot transform empty targets")
        initial_moves = list(move_utils.targets_to_moves(self._origin, self._targets))
        return self._add_dummy_start_end_to_moves(initial_moves)

    def _add_dummy_start_end_to_moves(self, move_list: List[Move]) -> List[Move]:
        """Append dummy moves to the start and the end of the move list."""
        start_move = move_utils.create_dummy_move()
        end_move = move_utils.create_dummy_move()
        return [start_move] + move_list + [end_move]

    def plan_motion(self, iteration_limit: int = 10) -> Tuple[bool, List[List[Move]]]:
        """Create and blend moves from targets."""
        self._clear_blend_log()
        to_blend = self._get_initial_moves_from_targets()
        assert to_blend, "Check target list"

        for i in range(iteration_limit):
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
                to_blend = self._blend_log[i]
        log.error("Could not converge!")
        return False, self._blend_log
