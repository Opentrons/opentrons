"""Head tool detector."""

import asyncio
import logging
from opentrons_hardware.hardware_control.tools.errors import ToolDetectionFailiure
from opentrons_ot3_firmware.messages import message_definitions, payloads
from opentrons_ot3_firmware.constants import ToolType, NodeId
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.hardware_control.tools.types import Mount
from typing import Callable, Dict

log = logging.getLogger(__name__)


class ToolDetector:
    """Class that detects tools on head."""

    attached_tools = {
        Mount.LEFT: ToolType(0),
        Mount.RIGHT: ToolType(0),
    }

    def __init__(
        self, messenger: CanMessenger, attached_tools: Dict[Mount, ToolType]
    ) -> None:
        """Constructor."""
        self._messenger = messenger
        self.attached_tools = attached_tools

    # Please use "Callable[[<parameters>], <return type>]" or "Callable"
    async def detect(self, callback: Callable[[Dict[Mount, ToolType]], None]) -> None:
        """Detect tool changes to run callback from other classes."""
        with WaitableCallback(self._messenger) as reader:
            # Poll to get attached tools response
            async for response, arbitration_id in reader:
                if (
                    isinstance(
                        response, message_definitions.PushToolsDetectedNotification
                    )
                    and arbitration_id.parts.originating_node_id == NodeId.head
                ):
                    tmp_dic = {
                        Mount.LEFT: ToolType(int(response.payload.a_motor.value)),
                        Mount.RIGHT: ToolType(int(response.payload.z_motor.value)),
                    }
                    if self.attached_tools != tmp_dic:
                        self.attached_tools = tmp_dic
                        log.info("Tools detected %s:", {self.attached_tools})
                        callback(self.attached_tools)
                    break

    async def run(self, retry_count: int, ready_wait_time_sec: float) -> None:
        """Continuously identify tool changes on head."""
        with WaitableCallback(self._messenger) as reader:
            # send get attached tools msg
            get_tools_message = message_definitions.AttachedToolsRequest(
                payload=payloads.EmptyPayload()
            )
            # fw is sending this msg as notifications,
            # so we don't really need to send it.
            await self._messenger.send(node_id=NodeId.head, message=get_tools_message)

            i = 1
            while True:
                try:
                    await asyncio.wait_for(
                        self._wait_tool_detection(reader), ready_wait_time_sec
                    )
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
                    Mount.LEFT: ToolType(int(response.payload.a_motor.value)),
                    Mount.RIGHT: ToolType(int(response.payload.z_motor.value)),
                }
                if self.attached_tools != tmp_dic:
                    self.attached_tools = tmp_dic
                    log.info("Tools detected %s:", {self.attached_tools})
                break
