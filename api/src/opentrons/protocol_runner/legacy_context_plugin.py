"""Customize the ProtocolEngine to control and track state of legacy protocols."""

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import PauseType as HardwarePauseType
from opentrons.protocol_engine import AbstractPlugin, actions as pe_actions

from .legacy_wrappers import LegacyProtocolContext


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
    2. Subscribe to the message broker commands and insert them into
       ProtocolEngine state for purely progress tracking purposes.
    """

    def __init__(
        self,
        hardware_api: HardwareAPI,
        protocol_context: LegacyProtocolContext,
    ) -> None:
        """Initialize the plugin with its dependencies."""
        self._hardware_api = hardware_api
        self._protocol_context = protocol_context

    def handle_action(self, action: pe_actions.Action) -> None:
        """React to a ProtocolEngine action."""
        if isinstance(action, pe_actions.PlayAction):
            self._hardware_api.resume(HardwarePauseType.PAUSE)

        elif isinstance(action, pe_actions.PauseAction):
            self._hardware_api.pause(HardwarePauseType.PAUSE)
