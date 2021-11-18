"""Customize the ProtocolEngine to monitor and control legacy (APIv2) protocols."""
from __future__ import annotations
from typing import Callable, Optional, NamedTuple

from opentrons.commands.types import CommandMessage as LegacyCommand
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import PauseType as HardwarePauseType
from opentrons.protocol_engine import AbstractPlugin, actions as pe_actions

from .legacy_wrappers import (
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
    LegacyProtocolContext,
    LegacyModuleLoadInfo,
)
from .legacy_command_mapper import LegacyCommandMapper


class ContextUnsubscribe(NamedTuple):
    """Unsubscribe functions for broker messages."""

    command_broker: Callable[[], None]
    labware_broker: Callable[[], None]
    pipette_broker: Callable[[], None]
    module_broker: Callable[[], None]


class LegacyContextPlugin(AbstractPlugin):
    """A ProtocolEngine plugin wrapping a legacy ProtocolContext.

    In the legacy ProtocolContext, protocol execution is accomplished
    by direct communication with the HardwareAPI, as opposed to an
    intermediate layer like the ProtocolEngine. This plugin wraps up
    and hides this behavior, so the ProtocolEngine can monitor and control
    the run of a legacy protocol without affecting the execution of
    the protocol commands themselves.

    This plugin allows a ProtocolEngine to:

    1. Play/pause the protocol run using the HardwareAPI, as was done before
       the ProtocolEngine existed.
    2. Subscribe to what is being done with the legacy ProtocolContext,
       and insert matching commands into ProtocolEngine state for
       purely progress-tracking purposes.
    """

    def __init__(
        self,
        hardware_api: HardwareAPI,
        protocol_context: LegacyProtocolContext,
        legacy_command_mapper: Optional[LegacyCommandMapper] = None,
    ) -> None:
        """Initialize the plugin with its dependencies."""
        self._hardware_api = hardware_api
        self._protocol_context = protocol_context
        self._legacy_command_mapper = legacy_command_mapper or LegacyCommandMapper()
        self._unsubcribe: Optional[ContextUnsubscribe] = None

    def setup(self) -> None:
        """Set up subscriptions to the context's message brokers."""
        context = self._protocol_context

        command_unsubscribe = context.broker.subscribe(
            topic="command",
            handler=self._dispatch_legacy_command,
        )
        labware_unsubscribe = context.labware_load_broker.subscribe(
            callback=self._dispatch_labware_loaded
        )
        pipette_unsubscribe = context.instrument_load_broker.subscribe(
            callback=self._dispatch_instrument_loaded
        )
        module_unsubscribe = context.module_load_broker.subscribe(
            callback=self._dispatch_module_loaded
        )

        self._unsubscribe = ContextUnsubscribe(
            command_broker=command_unsubscribe,
            labware_broker=labware_unsubscribe,
            pipette_broker=pipette_unsubscribe,
            module_broker=module_unsubscribe,
        )

    def teardown(self) -> None:
        """Unsubscribe from the context's message brokers."""
        if self._unsubscribe:
            for unsubscribe in self._unsubscribe:
                unsubscribe()

        self._unsubcribe = None

    def handle_action(self, action: pe_actions.Action) -> None:
        """React to a ProtocolEngine action."""
        if isinstance(action, pe_actions.PlayAction):
            self._hardware_api.resume(HardwarePauseType.PAUSE)

        elif isinstance(action, pe_actions.PauseAction):
            self._hardware_api.pause(HardwarePauseType.PAUSE)

    def _dispatch_legacy_command(self, command: LegacyCommand) -> None:
        pe_action = self._legacy_command_mapper.map_command(command=command)
        self.dispatch_threadsafe(pe_action)

    def _dispatch_labware_loaded(
        self, labware_load_info: LegacyLabwareLoadInfo
    ) -> None:
        pe_command = self._legacy_command_mapper.map_labware_load(
            labware_load_info=labware_load_info
        )
        self.dispatch_threadsafe(pe_actions.UpdateCommandAction(command=pe_command))

    def _dispatch_instrument_loaded(
        self, instrument_load_info: LegacyInstrumentLoadInfo
    ) -> None:
        pe_command = self._legacy_command_mapper.map_instrument_load(
            instrument_load_info=instrument_load_info
        )
        self.dispatch_threadsafe(pe_actions.UpdateCommandAction(command=pe_command))

    def _dispatch_module_loaded(self, module_load_info: LegacyModuleLoadInfo) -> None:
        pe_command = self._legacy_command_mapper.map_module_load(
            module_load_info=module_load_info
        )
        self.dispatch_threadsafe(pe_actions.UpdateCommandAction(command=pe_command))
