from typing import List

from .types import PauseType


class PauseManager:
    """This class determines whether or not the hardware controller should
    pause or resume by evaluating the pause and resume types. The use of two
    pause types are used to separate the delay resume (triggered when the delay
    timer runs out) and the pause resume (trigged by user via the app).
    """

    def __init__(self) -> None:
        self.queue: List[PauseType] = []

    @property
    def should_pause(self) -> bool:
        return bool(self.queue)

    def resume(self, pause_type: PauseType) -> None:
        try:
            self.queue.remove(pause_type)
        except ValueError:
            pass

    def pause(self, pause_type: PauseType) -> None:
        if pause_type not in self.queue:
            self.queue.append(pause_type)

    def reset(self) -> None:
        self.queue = []
