"""Customize the ProtocolEngine to monitor and control legacy (APIv2) protocols."""
from __future__ import annotations

import asyncio
from contextlib import ExitStack
from typing import Optional

from opentrons.legacy_commands.types import CommandMessage as LegacyCommand
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_api.core.legacy.load_info import LoadInfo
from opentrons.protocol_engine import AbstractPlugin, actions as pe_actions
from opentrons.util.broker import ReadOnlyBroker

from .legacy_command_mapper import LegacyCommandMapper


class LegacyContextPlugin(AbstractPlugin):
    """A ProtocolEngine plugin to monitor and control an APIv2 protocol.

    In the legacy ProtocolContext, protocol execution is accomplished
    by direct communication with the HardwareControlAPI, as opposed to an
    intermediate layer like the ProtocolEngine. This plugin wraps up
    and hides this behavior, so the ProtocolEngine can monitor
    the run of a legacy protocol without affecting the execution of
    the protocol commands themselves.

    This plugin allows a ProtocolEngine to subscribe to what is being done with the
    legacy ProtocolContext, and insert matching commands into ProtocolEngine state for
    purely progress-tracking purposes.
    """

    def __init__(
        self,
        engine_loop: asyncio.AbstractEventLoop,
        broker: LegacyBroker,
        equipment_broker: ReadOnlyBroker[LoadInfo],
        legacy_command_mapper: Optional[LegacyCommandMapper] = None,
    ) -> None:
        """Initialize the plugin with its dependencies."""
        self._engine_loop = engine_loop

        self._broker = broker
        self._equipment_broker = equipment_broker
        self._legacy_command_mapper = legacy_command_mapper or LegacyCommandMapper()

        self._subscription_exit_stack: Optional[ExitStack] = None

    def setup(self) -> None:
        """Set up the plugin.

        Subscribe to the APIv2 context's message brokers to be informed
        of the APIv2 protocol's activity.
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

    # todo(mm, 2024-08-21): This no longer needs to be async.
    async def teardown(self) -> None:
        """Tear down the plugin, undoing the work done in `setup()`.

        Called by Protocol Engine.
        At this point, the APIv2 protocol script must have exited.
        """
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
        future = asyncio.run_coroutine_threadsafe(
            self._dispatch_action_list(pe_actions), self._engine_loop
        )
        future.result()

    def _handle_equipment_loaded(self, load_info: LoadInfo) -> None:
        """Handle an equipment load reported by the legacy APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_actions = self._legacy_command_mapper.map_equipment_load(load_info=load_info)
        future = asyncio.run_coroutine_threadsafe(
            self._dispatch_action_list(pe_actions), self._engine_loop
        )
        future.result()

    async def _dispatch_action_list(self, actions: list[pe_actions.Action]) -> None:
        for action in actions:
            self.dispatch(action)
