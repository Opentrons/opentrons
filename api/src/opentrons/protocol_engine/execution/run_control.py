"""Run control command side-effect logic."""

from ..state import StateStore
from ..actions import ActionDispatcher, PauseAction


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

    async def pause(self) -> None:
        """Issue a PauseAction to the store, pausing the run."""
        if not self._state_store.get_configs().ignore_pause:
            self._action_dispatcher.dispatch(PauseAction())
            await self._state_store.wait_for(
                condition=self._state_store.commands.get_is_running
            )
