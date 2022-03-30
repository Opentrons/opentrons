from typing_extensions import Protocol
from ..types import PauseType


class ExecutionControllable(Protocol):
    """A protocol specifying run control (pause, resume)."""

    def pause(self, pause_type: PauseType) -> None:
        """
        Pause motion of the robot after a current motion concludes.

        Individual calls to move
        (which aspirate and dispense and other calls may depend on) are
        considered atomic and will always complete if they have been called
        prior to a call to this method. However, subsequent calls to move that
        occur when the system is paused will not proceed until the system is
        resumed with resume.
        """
        ...

    def pause_with_message(self, message: str) -> None:
        """Pause motion of the robot as with pause, but specify a message."""
        ...

    def resume(self, pause_type: PauseType) -> None:
        """
        Resume motion after a call to pause.
        """
        ...

    async def delay(self, duration_s: float) -> None:
        """Delay execution by pausing and sleeping."""
        ...
