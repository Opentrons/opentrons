"""Run control command side-effect logic."""

from ..state import StateStore, PauseAction


class RunControlHandler:
    """Implementation logic for protocol run control."""

    _state_store: StateStore

    def __init__(self, state_store: StateStore) -> None:
        """Initialize a RunControlHandler instance."""
        self._state_store = state_store

    async def pause(self) -> None:
        """Issue a PauseAction to the store, pausing the run."""
        self._state_store.handle_action(PauseAction())
        await self._state_store.wait_for(
            condition=self._state_store.commands.get_is_running
        )
