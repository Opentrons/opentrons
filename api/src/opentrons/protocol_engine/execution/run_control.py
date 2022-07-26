"""Run control command side-effect logic."""
import asyncio

from ..state import StateStore
from ..actions import ActionDispatcher, PauseAction, PauseSource


class RunControlHandler:
    """Implementation logic for protocol run control."""

    _state_store: StateStore

    def __init__(
        self,
        state_store: StateStore,
        action_dispatcher: ActionDispatcher,
    ) -> None:
        """Initialize a RunControlHandler instance."""
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher

    async def wait_for_resume(self) -> None:
        """Issue a PauseAction to the store, pausing the run."""
        if not self._state_store.config.ignore_pause:
            self._action_dispatcher.dispatch(PauseAction(source=PauseSource.PROTOCOL))
            await self._state_store.wait_for(
                condition=self._state_store.commands.get_is_running
            )

    async def wait_for_duration(self, seconds: float) -> None:
        """Delay protocol execution for a duration."""
        if not self._state_store.config.ignore_pause:
            await asyncio.sleep(seconds)
