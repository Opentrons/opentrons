"""Customize the ProtocolEngine to monitor and control legacy (APIv2) protocols."""
from __future__ import annotations

from asyncio import create_task, Task
from contextlib import ExitStack
from typing import List, Optional

from opentrons.legacy_commands.types import CommandMessage as LegacyCommand
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_api.core.legacy.load_info import LoadInfo
from opentrons.protocol_engine import AbstractPlugin, actions as pe_actions
from opentrons.util.broker import ReadOnlyBroker

from .legacy_command_mapper import LegacyCommandMapper
from .thread_async_queue import ThreadAsyncQueue


class LegacyContextPlugin(AbstractPlugin):
    """A ProtocolEngine plugin to monitor and control an APIv2 protocol.

    In the legacy ProtocolContext, protocol execution is accomplished
    by direct communication with the HardwareControlAPI, as opposed to an
    intermediate layer like the ProtocolEngine. This plugin wraps up
    and hides this behavior, so the ProtocolEngine can monitor and control
    the run of a legacy protocol without affecting the execution of
    the protocol commands themselves.

    This plugin allows a ProtocolEngine to:

    1. Play/pause the protocol run using the HardwareControlAPI, as was done before
       the ProtocolEngine existed.
    2. Subscribe to what is being done with the legacy ProtocolContext,
       and insert matching commands into ProtocolEngine state for
       purely progress-tracking purposes.
    """

    def __init__(
        self,
        broker: LegacyBroker,
        equipment_broker: ReadOnlyBroker[LoadInfo],
        legacy_command_mapper: Optional[LegacyCommandMapper] = None,
    ) -> None:
        """Initialize the plugin with its dependencies."""
        self._broker = broker
        self._equipment_broker = equipment_broker
        self._legacy_command_mapper = legacy_command_mapper or LegacyCommandMapper()

        # We use a non-blocking queue to communicate activity
        # from the APIv2 protocol, which is running in its own thread,
        # to the ProtocolEngine, which is running in the main thread's async event loop.
        #
        # The queue being non-blocking lets the protocol communicate its activity
        # instantly *even if the event loop is currently occupied by something else.*
        # Various things can accidentally occupy the event loop for too long.
        # So if the protocol had to wait for the event loop to be free
        # every time it reported some activity,
        # it could visibly stall for a moment, making its motion jittery.
        #
        # TODO(mm, 2024-03-22): See if we can remove this non-blockingness now.
        # It was one of several band-aids introduced in ~v5.0.0 to mitigate performance
        # problems. v6.3.0 started running some Python protocols directly through
        # Protocol Engine, without this plugin, and without any non-blocking queue.
        # If performance is sufficient for those, that probably means the
        # performance problems have been resolved in better ways elsewhere
        # and we don't need this anymore.
        self._actions_to_dispatch = ThreadAsyncQueue[List[pe_actions.Action]]()
        self._action_dispatching_task: Optional[Task[None]] = None

        self._subscription_exit_stack: Optional[ExitStack] = None

    def setup(self) -> None:
        """Set up the plugin.

        * Subscribe to the APIv2 context's message brokers to be informed
          of the APIv2 protocol's activity.
        * Kick off a background task to inform Protocol Engine of that activity.
        """
        # Subscribe to activity on the APIv2 context,
        # and arrange to unsubscribe when this plugin is torn down.
        # Use an exit stack so if any part of this setup fails,
        # we clean up the parts that succeeded in reverse order.
        with ExitStack() as exit_stack:
            command_broker_unsubscribe = self._broker.subscribe(
                topic="command",
                handler=self._handle_legacy_command,
            )
            exit_stack.callback(command_broker_unsubscribe)

            exit_stack.enter_context(
                self._equipment_broker.subscribed(
                    callback=self._handle_equipment_loaded
                )
            )

            # All subscriptions succeeded.
            # Save the exit stack so our teardown method can use it later
            # to clean up these subscriptions.
            self._subscription_exit_stack = exit_stack.pop_all()

        # Kick off a background task to report activity to the ProtocolEngine.
        self._action_dispatching_task = create_task(self._dispatch_all_actions())

    async def teardown(self) -> None:
        """Tear down the plugin, undoing the work done in `setup()`.

        Called by Protocol Engine.
        At this point, the APIv2 protocol script must have exited.
        """
        self._actions_to_dispatch.done_putting()
        try:
            if self._action_dispatching_task is not None:
                await self._action_dispatching_task
                self._action_dispatching_task = None
        finally:
            if self._subscription_exit_stack is not None:
                self._subscription_exit_stack.close()
                self._subscription_exit_stack = None

    def handle_action(self, action: pe_actions.Action) -> None:
        """React to a ProtocolEngine action."""
        # TODO(jbl 2022-07-06) handle_action stub should be completely removed
        pass

    def _handle_legacy_command(self, command: LegacyCommand) -> None:
        """Handle a command reported by the legacy APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_actions = self._legacy_command_mapper.map_command(command=command)
        self._actions_to_dispatch.put(pe_actions)

    def _handle_equipment_loaded(self, load_info: LoadInfo) -> None:
        """Handle an equipment load reported by the legacy APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_actions = self._legacy_command_mapper.map_equipment_load(load_info=load_info)
        self._actions_to_dispatch.put(pe_actions)

    async def _dispatch_all_actions(self) -> None:
        """Dispatch all actions to the `ProtocolEngine`.

        Exits only when `self._actions_to_dispatch` is closed
        (or an unexpected exception is raised).
        """
        async for action_batch in self._actions_to_dispatch.get_async_until_closed():
            # It's critical that we dispatch this batch of actions as one atomic
            # sequence, without yielding to the event loop.
            # Although this plugin only means to use the ProtocolEngine as a way of
            # passively exposing the protocol's progress, the ProtocolEngine is still
            # theoretically active, which means it's constantly watching in the
            # background to execute any commands that it finds `queued`.
            #
            # For example, one of these action batches will often want to
            # instantaneously create a running command by having a queue action
            # immediately followed by a run action. We cannot let the
            # ProtocolEngine's background task see the command in the `queued` state,
            # or it will try to execute it, which the legacy protocol is already doing.
            for action in action_batch:
                self.dispatch(action)
