"""Forward events from a `HardwareControlAPI` into a `ProtocolEngine`."""

from __future__ import annotations

from asyncio import AbstractEventLoop, run_coroutine_threadsafe
from typing import Callable, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import HardwareEvent

from opentrons.protocol_engine.actions import ActionDispatcher, HardwareEventAction


_UnsubscribeCallback= Callable[[], None]


class HardwareEventForwarder:
    """Forward events from a `HardwareControlAPI` into a `ProtocolEngine`."""

    def __init__(self, unsubscribe_callback: _UnsubscribeCallback) -> None:
        self._unsubscribe_callback: Optional[_UnsubscribeCallback] = unsubscribe_callback

    @classmethod
    def start_forwarding(
        cls,
        event_source: HardwareControlAPI,
        action_destination: ActionDispatcher,
        destination_loop: AbstractEventLoop,
    ) -> HardwareEventForwarder:
        """Subscribe to hardware events and start forwarding them as PE actions.

        Args:
            event_source: The HardwareControlAPI whose events we will listen for.
                Assumed to be running in a separate thread from action_destination.
            action_destination: The ActionDispatcher to dispatch actions into.
            destination_loop: The event loop that action_destination is running in.
                When the HardwareEventForwarder dispatches an action into
                action_destination, it will do that as a task running in this loop.
        """

        async def dispatch_in_loop(event: HardwareEvent) -> None:
            """Convert a HW event to an action, and dispatch into action_destination.

            This must run in the event loop that owns action_destination, for safety.

            Defined as an async function so we can use this with
            run_coroutine_threadsafe(), which lets us block until
            the dispatch completes.
            """
            action_destination.dispatch(HardwareEventAction(event=event))

        def handle_hw_event_from_hw_thread(event: HardwareEvent) -> None:
            """Handle a hardware event in a thread-safe way.

            This method will only return after the `ProtocolEngine` processes the event.
            If something else is hogging the event loop thread that the `ProtocolEngine`
            is running in, that may take a moment.
            """
            coroutine = dispatch_in_loop(event)
            future = run_coroutine_threadsafe(coroutine, destination_loop)

            # Wait for the dispatch to complete before returning,
            # which is important for ordering guarantees.
            #
            # We assume we're being called from a thread other than the one that
            # owns destination_loop. If it's the same thread for whatever reason,
            # this will deadlock.
            future.result()

        unsubscribe_callback = event_source.register_callback(
            handle_hw_event_from_hw_thread
        )
        return cls(unsubscribe_callback=unsubscribe_callback)

    # todo(mm, 2022-02-01):
    # Find a way to provide a stronger guarantee so the caller doesn't have to
    # worry about straggling events.
    # AnyIO blocking portals can help with this.
    def stop_forwarding_soon(self) -> None:
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
