"""Forward door events from a `HardwareControlAPI` into a `ProtocolEngine`."""

from __future__ import annotations

from asyncio import get_running_loop, run_coroutine_threadsafe
from typing import Callable, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    HardwareEvent,
    DoorStateNotification,
    DoorState,
    PauseType,
)

from opentrons.protocol_engine.actions import ActionDispatcher, DoorChangeAction

from ..state import StateStore


_UnsubscribeCallback = Callable[[], None]


class DoorWatcher:
    """Forward door events from a `HardwareControlAPI` into a `ProtocolEngine`."""

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareControlAPI,
        action_dispatcher: ActionDispatcher,
    ) -> None:
        """Initialize the DoorWatcher.

        Args:
            state_store: The StateStore to check if the protocol queue is running.
            hardware_api: The HardwareControlAPI whose events we will listen for.
                Assumed to be running in a separate thread from action_dispatcher.
            action_dispatcher: The ActionDispatcher to dispatch actions into.
                Assumed to be owned by the same event loop that this
                DoorWatcher was constructed in.
        """
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._action_dispatcher = action_dispatcher
        self._loop = get_running_loop()
        self._unsubscribe_callback: Optional[_UnsubscribeCallback] = None

    def start(self) -> None:
        """Subscribe to hardware events and start forwarding them as PE actions."""
        if self._unsubscribe_callback is None:
            self._unsubscribe_callback = self._hardware_api.register_callback(
                self._handle_hardware_door_event
            )

    # todo(mm, 2022-02-01):
    # Find a way to prevent straggling events.
    # AnyIO blocking portals can help with this.
    def stop_soon(self) -> None:
        """Unsubscribe from hardware events.

        Safe to call more than once.

        Warning:
            This method does not wait for pending event dispatches to complete.
            Depending on timing, there may be straggler hardware events
            that the `ActionDispatcher` will see even after this method returns.
        """
        if self._unsubscribe_callback is not None:
            self._unsubscribe_callback()
            self._unsubscribe_callback = None

    def _handle_hardware_door_event(self, event: HardwareEvent) -> None:
        """Handle a door state hardware event, ensuring thread-safety.

        This is used as a callback for HardwareControlAPI.register_callback(),
        and it's run inside the hardware thread.

        This method will only return after the `ProtocolEngine` processes the event.
        If something else is hogging the event loop thread that the `ProtocolEngine`
        is running in, that may take a moment, and the hardware thread may be blocked.

        This method will deadlock if it's ever run from the same thread that
        owns the event loop that this DoorWatcher was constructed in.
        """
        if isinstance(event, DoorStateNotification):
            action = DoorChangeAction(door_state=event.new_state)
            coroutine = self._dispatch_action(action)
            future = run_coroutine_threadsafe(coroutine, self._loop)
            # Wait for the dispatch to complete before returning,
            # which is important for ordering guarantees.
            future.result()

    async def _dispatch_action(self, action: DoorChangeAction) -> None:
        """Dispatch an action into self._action_dispatcher.

        This must run in the event loop that owns self._action_dispatcher, for safety.

        Defined as an async function, so we can use this with
        run_coroutine_threadsafe(), which lets us block until
        the dispatch completes.
        """
        if (
            self._state_store.commands.get_is_running()
            and action.door_state == DoorState.OPEN
            and self._state_store.config.block_on_door_open
        ):
            self._hardware_api.pause(PauseType.PAUSE)

        self._action_dispatcher.dispatch(action)
