from typing import List

from opentrons.config import feature_flags as ff

from .types import DoorState, PauseType, PauseResumeError


class PauseManager:
    """This class determines whether or not the hardware controller should
    pause or resume by evaluating the pause and resume types. The use of two
    pause types are used to separate the delay resume (triggered when the delay
    timer runs out) and the pause resume (trigged by user via the app).
    """

    def __init__(self, door_state: DoorState) -> None:
        self.queue: List[PauseType] = []
        self._blocked_by_door = self._evaluate_door_state(door_state)

    @property
    def should_pause(self) -> bool:
        return bool(self.queue)

    @property
    def blocked_by_door(self) -> bool:
        return self._blocked_by_door

    def _evaluate_door_state(self, door_state: DoorState) -> bool:
        if ff.enable_door_safety_switch():
            return door_state is DoorState.OPEN
        return False

    def set_door(self, door_state: DoorState) -> None:
        self._blocked_by_door = self._evaluate_door_state(door_state)

    def resume(self, pause_type: PauseType) -> None:
        # door should be closed before a resume from the app can be received
        if self._blocked_by_door and pause_type is PauseType.PAUSE:
            raise PauseResumeError
        if pause_type in self.queue:
            self.queue.remove(pause_type)

    def pause(self, pause_type: PauseType) -> None:
        if pause_type not in self.queue:
            self.queue.append(pause_type)

    def reset(self) -> None:
        self.queue = []
