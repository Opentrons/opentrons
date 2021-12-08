import logging
from typing import List, Optional

from opentrons_hardware.hardware_control.motion_planning import move_utils
from opentrons_hardware.hardware_control.motion_planning.types import Coordinates, Move, MoveTarget, Block, SystemConstraints

log = logging.getLogger(__name__)





class MoveManager:

    def __init__(
        self,
        constraints: SystemConstraints,
        origin: Optional[Coordinates] = Coordinates(0, 0, 0, 0),
        target_list: Optional[List[MoveTarget]] = [],
        move_list: Optional[List[Move]] = []
    ) -> None:
        self._constraints = constraints
        self._origin = origin
        self._targets = target_list
        self._moves = move_list
        self._blend_log: List[Move] = []

    def _clear_moves(self):
        self._moves = []
    
    def _clear_targets(self):
        self._targets = []
    
    def _clear_blend_log(self):
        self._blend_log = []

    def reset(self):
        self._origin = Coordinates(0, 0, 0, 0)
        self._clear_moves()
        self._clear_targets()
    
    def set_origin(self, origin: Coordinates):
        self._origin = origin
    
    def add_targets(self, target_list: List[Coordinates]):
        self._targets.extend(target_list)

    def _get_initial_moves_from_targets(self) -> List[Move]:
        """Create a list of moves from the target list for blending"""
        initial_moves = list(move_utils.targets_to_moves(self._origin, self._targets))
        return self._add_dummy_start_end_to_moves(initial_moves)

    def _add_dummy_start_end_to_moves(self, move_list: List[Move]):
        start_move = move_utils.create_dummy_move()
        end_move = move_utils.create_dummy_move()
        return [start_move] + move_list + [end_move]

    def plan_motion(self, iteration_limit: Optional[int] = 10):
        self._clear_blend_log()
        to_blend = self._get_initial_moves_from_targets()

        for i in range(iteration_limit):
            print(f'Iter: {i}')
            self._blend_log.append([])
            moveiter = iter(to_blend)
            first = next(moveiter)
            middle = next(moveiter)
            while True:
                try:
                    last = next(moveiter)
                    print(f'Move: {middle}')
                    self._blend_log[i].append(move_utils.build_move(middle, first, last, self._constraints))
                    first = middle
                    middle = last
                except StopIteration:
                    break

            if move_utils.all_blended(self._constraints, self._blend_log[i]):
                log.info(f'built {len(self._blend_log[-1])} moves with '
                        f'{sum(list(m.nonzero_blocks for m in self._blend_log[i]))} '
                        f'non-zero blocks after {i+1} iteration(s)')
                return True, self._blend_log
            else:
                self._blend_log[i] = self._add_dummy_start_end_to_moves(self._blend_log[i])
                to_blend = self._blend_log[i]
                print(f'To blend: {to_blend}')

        log.error('Could not converge!')
        return False, self._blend_log
        



