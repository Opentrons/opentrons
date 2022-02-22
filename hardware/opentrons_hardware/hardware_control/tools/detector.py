"""Head tool detector."""

import asyncio
import logging
from opentrons_hardware.hardware_control.tools.errors import ToolDetectionFailiure
from opentrons_ot3_firmware.messages import message_definitions, payloads
from opentrons_ot3_firmware.constants import ToolType, NodeId
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.hardware_control.tools.types import Carrier
from typing import AsyncGenerator, Dict

log = logging.getLogger(__name__)


class ToolDetector:
    """Class that detects tools on head."""

    def __init__(
        self, messenger: CanMessenger, attached_tools: Dict[Carrier, ToolType]
    ) -> None:
        """Constructor."""
        self._messenger = messenger
        self._attached_tools = attached_tools

    async def detect(self) -> AsyncGenerator[Dict[Carrier, ToolType], None]:
        """Detect tool changes."""
        async for message in self._messenger._drive:
            if isinstance(message, message_definitions.PushToolsDetectedNotification):
                tmp_dic = {
                    Carrier.LEFT: ToolType(int(message.payload.a_motor.value)),
                    Carrier.RIGHT: ToolType(int(message.payload.z_motor.value)),
                }
                if self._attached_tools != tmp_dic:
                    self._attached_tools = tmp_dic
                    log.info("Tools detected %s:", {self._attached_tools})
                    yield tmp_dic

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
                    Carrier.LEFT: ToolType(int(response.payload.a_motor.value)),
                    Carrier.RIGHT: ToolType(int(response.payload.z_motor.value)),
                }
                if self._attached_tools != tmp_dic:
                    self._attached_tools = tmp_dic
                    log.info("Tools detected %s:", {self._attached_tools})
                break
