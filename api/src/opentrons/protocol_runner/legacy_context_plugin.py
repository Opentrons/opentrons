"""Customize the ProtocolEngine to monitor and control legacy (APIv2) protocols."""
from __future__ import annotations

from asyncio import create_task
from contextlib import AsyncExitStack
from typing import Optional

from opentrons.commands.types import CommandMessage as LegacyCommand
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import PauseType as HardwarePauseType
from opentrons.protocol_engine import AbstractPlugin, actions as pe_actions

from .legacy_wrappers import (
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
    LegacyProtocolContext,
    LegacyModuleLoadInfo,
)
from .legacy_command_mapper import LegacyCommandMapper
from .thread_async_queue import ThreadAsyncQueue, QueueClosed


import logging
log = logging.getLogger(__name__)


class LegacyContextPlugin(AbstractPlugin):
    """A ProtocolEngine plugin wrapping a legacy ProtocolContext.

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
        hardware_api: HardwareControlAPI,
        protocol_context: LegacyProtocolContext,
        legacy_command_mapper: Optional[LegacyCommandMapper] = None,
    ) -> None:
        """Initialize the plugin with its dependencies."""
        self._hardware_api = hardware_api
        self._protocol_context = protocol_context
        self._legacy_command_mapper = legacy_command_mapper or LegacyCommandMapper()

        # We use a non-blocking queue to communicate activity
        # from the APIv2 protocol, which is running in a thread,
        # to the ProtocolEngine, which is running in the main thread's async event loop.
        #
        # The non-blocking property lets the protocol communicate its activity
        # instantly *even if the event loop is currently occupied by something else.*
        # Various things can accidentally occupy the event loop for too long.
        # So if the protocol had to wait for the event loop to be free
        # every time it reported some activity,
        # it could visibly stall for a moment, making its motion jittery.
        self._actions_to_dispatch = ThreadAsyncQueue[pe_actions.Action]()

        self._exit_stack: Optional[AsyncExitStack] = None

    async def setup(self) -> None:
        """Set up the plugin.

        * Subscribe to the APIv2 context's message brokers to be informed
          of the APIv2 protocol's activity.
        * Kick off a background task to inform Protocol Engine of that activity.
        """
        context = self._protocol_context

        # If any part of this setup fails,
        # clean up the parts that succeeded in reverse order.
        async with AsyncExitStack() as exit_stack:
            # Subscribe to activity on the APIv2 context,
            # and arrange to unsubscribe when we're torn down.

            command_unsubscribe = context.broker.subscribe(
                topic="command",
                handler=self._handle_legacy_command,
            )
            exit_stack.callback(command_unsubscribe)

            labware_unsubscribe = context.labware_load_broker.subscribe(
                callback=self._handle_labware_loaded
            )
            exit_stack.callback(labware_unsubscribe)

            pipette_unsubscribe = context.instrument_load_broker.subscribe(
                callback=self._handle_instrument_loaded
            )
            exit_stack.callback(pipette_unsubscribe)

            module_unsubscribe = context.module_load_broker.subscribe(
                callback=self._handle_module_loaded
            )
            exit_stack.callback(module_unsubscribe)

            # Kick off a background task to report activity to the ProtocolEngine,
            # and arrange to await its exit when we're torn down.

            action_dispatching_task = create_task(self._dispatch_all_actions())

            async def await_action_dispatching_task() -> None:
                await action_dispatching_task

            exit_stack.push_async_callback(await_action_dispatching_task)

            # Arrange to close the actions queue when we're torn down,
            # so the background task knows to exit.
            #
            # Registering this cleanup must come below registering the await of the
            # background task, so this will happen first on teardown
            # and the await won't deadlock.

            exit_stack.callback(self._actions_to_dispatch.done_putting)

            # All setup succeeded.
            # Save the exit stack so our teardown method can clean up these resources.

            self._exit_stack = exit_stack.pop_all()

    async def teardown(self) -> None:
        """Tear down the plugin, undoing the work done in `setup()`.

        Called by Protocol Engine.
        At this point, the APIv2 protocol script has exited and is done
        """
        # self._exit_stack should never be None at this point.
        if self._exit_stack is not None:
            await self._exit_stack.aclose()
            self._exit_stack = None

    def handle_action(self, action: pe_actions.Action) -> None:
        """React to a ProtocolEngine action."""
        if isinstance(action, pe_actions.PlayAction):
            self._hardware_api.resume(HardwarePauseType.PAUSE)

        elif (
            isinstance(action, pe_actions.PauseAction)
            and action.source == pe_actions.PauseSource.CLIENT
        ):
            self._hardware_api.pause(HardwarePauseType.PAUSE)

    def _handle_legacy_command(self, command: LegacyCommand) -> None:
        """Handle a command reported by the APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        log.debug("MAX: Handling legacy command.")
        pe_actions = self._legacy_command_mapper.map_command(command=command)
        for pe_action in pe_actions:
            self._actions_to_dispatch.put(pe_action)
        log.debug("MAX: Done handling legacy command.")

    def _handle_labware_loaded(self, labware_load_info: LegacyLabwareLoadInfo) -> None:
        """Handle a labware load reported by the APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_command = self._legacy_command_mapper.map_labware_load(
            labware_load_info=labware_load_info
        )
        pe_action = pe_actions.UpdateCommandAction(command=pe_command)
        self._actions_to_dispatch.put(pe_action)

    def _handle_instrument_loaded(
        self, instrument_load_info: LegacyInstrumentLoadInfo
    ) -> None:
        """Handle an instrument (pipette) load reported by the APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_command = self._legacy_command_mapper.map_instrument_load(
            instrument_load_info=instrument_load_info
        )
        pe_action = pe_actions.UpdateCommandAction(command=pe_command)
        self._actions_to_dispatch.put(pe_action)

    def _handle_module_loaded(self, module_load_info: LegacyModuleLoadInfo) -> None:
        """Handle a module load reported by the APIv2 protocol.

        Used as a broker callback, so this will run in the APIv2 protocol's thread.
        """
        pe_command = self._legacy_command_mapper.map_module_load(
            module_load_info=module_load_info
        )
        pe_action = pe_actions.UpdateCommandAction(command=pe_command)
        self._actions_to_dispatch.put(pe_action)

    async def _dispatch_all_actions(self) -> None:
        """Dispatch all actions to the `ProtocolEngine`.

        Exits only when `self._actions_to_dispatch` is closed
        (or an unexpected exception is raised).
        """
        while True:
            try:
                log.debug("MAX: Dispatching action in event loop.")
                action = await self._actions_to_dispatch.get_async()
                log.debug("MAX: Done dispatching action in event loop.")
            except QueueClosed:
                break
            else:
                self.dispatch(action)
