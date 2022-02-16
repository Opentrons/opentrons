"""Head tool detector"""

import asyncio
import logging
from typing import Dict
from typing_extensions import Final
from dataclasses import dataclass
from opentrons_hardware.hardware_control.tools.errors import ToolDetectionFailiure
from opentrons_ot3_firmware.constants import ToolType

from opentrons_ot3_firmware import NodeId
from opentrons_ot3_firmware.messages import message_definitions, payloads

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.hardware_control.tools.errors import ToolDetectionFailiure
from opentrons_hardware.hardware_control.tools.types import Mount

log = logging.getLogger(__name__)


class ToolDetector:
    """Class that detects tools on head."""

    AttachedTools = {
        Mount.LEFT: ToolType(0),
        Mount.RIGHT: ToolType(0),
    }

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

    async def run(self, retry_count: int, ready_wait_time_sec: float) -> None:
        """Identify current attached tools.
        Args:
            retry_count: How many times to try.
            ready_wait_time_sec: How long to wait to register change in tools.
        Returns:
            None
        """
        with WaitableCallback(self._messenger) as reader:
            # send get attached tools msg
            get_tools_message = message_definitions.AttachedToolsRequest(
                payload=payloads.EmptyPayload()
            )
            await self._messenger.send(node_id=NodeId.head, message=get_tools_message)

            i = 1
            while True:
                try:
                    await asyncio.wait_for(
                        self._wait_tool_detection(reader), ready_wait_time_sec
                    )
                    break
                except asyncio.TimeoutError:
                    log.warning(
                        f"Try {i}: Tool detection not ready "
                        f"after {ready_wait_time_sec} seconds."
                    )
                    if i < retry_count:
                        i += 1
                    else:
                        raise ToolDetectionFailiure()

    async def _wait_tool_detection(self, reader: WaitableCallback) -> None:
        """Wait for tool detection."""
        # Send attached tool request
        attached_tools_request_message = message_definitions.AttachedToolsRequest(
            payload=payloads.EmptyPayload()
        )
        await self._messenger.send(
            node_id=NodeId.head, message=attached_tools_request_message
        )
        # Poll to get attached tools response
        async for response, arbitration_id in reader:
            if (
                isinstance(response, message_definitions.PushToolsDetectedNotification)
                and arbitration_id.parts.originating_node_id == NodeId.head
            ):
                tmp_dic = {
                    Mount.LEFT: ToolType(response.a_mount),
                    Mount.RIGHT: ToolType(response.z_mount),
                }
                if not ToolDetector.AttachedTools:
                    ToolDetector.AttachedTools = tmp_dic
                    log.info("Tools detected %s:", {ToolDetector.AttachedTools})
                elif ToolDetector.AttachedTools != tmp_dic:
                    ToolDetector.AttachedTools = tmp_dic
                    log.info("Tools detected %s:", {ToolDetector.AttachedTools})
                break
