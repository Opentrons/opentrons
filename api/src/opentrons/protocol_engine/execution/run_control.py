"""Run control command side-effect logic."""

import asyncio

from ..actions import ActionDispatcher, PauseAction, PauseSource
from ..state.state import StateStore


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
                condition=self._can_resume_from_protocol_pause
            )

    def _can_resume_from_protocol_pause(self) -> bool:
        """Return whether a protocol pause should stop waiting."""
        return (
            self._state_store.commands.get_is_running()
            or self._state_store.commands.get_is_awaiting_recovery()
        )

    async def wait_for_duration(self, seconds: float) -> None:
        """Delay protocol execution for a duration."""
        if not self._state_store.config.ignore_pause:
            await asyncio.sleep(seconds)

    async def wait_for_tasks(self, tasks: list[str]) -> None:
        """Wait for concurrent tasks to complete."""
        await self._state_store.wait_for(
            condition=lambda: self._state_store.tasks.all_tasks_finished_or_any_task_failed(
                task_ids=tasks
            )
        )
