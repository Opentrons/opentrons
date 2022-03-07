"""Head tool detector."""

import logging
from typing import AsyncIterator

from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.messages import message_definitions
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.drivers.can_bus import CanMessenger

from opentrons_hardware.hardware_control.tools.types import ToolDetectionResult

log = logging.getLogger(__name__)


class ToolDetector:
    """Class that detects tools on head."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor.

        Args:
            messenger: An initialized and running CanMessenger.
        """
        self._messenger = messenger

    async def detect(
        self,
    ) -> AsyncIterator[ToolDetectionResult]:
        """Detect tool changes."""
        with WaitableCallback(self._messenger) as wc:
            # send request message once, to establish initial state
            attached_tool_request_message = message_definitions.AttachedToolsRequest()
            await self._messenger.send(
                node_id=NodeId.host, message=attached_tool_request_message
            )
            async for response, arbitration_id in wc:
                if isinstance(
                    response, message_definitions.PushToolsDetectedNotification
                ):

                    def _check_tool(i: int) -> ToolType:
                        """Either return a valid tool or "undefined" on error."""
                        try:
                            return ToolType(i)
                        except ValueError:
                            return ToolType.undefined_tool

                    yield ToolDetectionResult(
                        left=_check_tool(response.payload.z_motor.value),
                        right=_check_tool(response.payload.a_motor.value),
                        gripper=_check_tool(response.payload.gripper.value),
                    )
