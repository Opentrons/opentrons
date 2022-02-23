"""Head tool detector."""

import logging
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.drivers.can_bus import CanMessenger
from typing import AsyncGenerator, Tuple


log = logging.getLogger(__name__)


class ToolDetector:
    """Class that detects tools on head."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger
        self._reader = WaitableCallback(self._messenger)

    async def detect(
        self,
    ) -> AsyncGenerator[Tuple[MessageDefinition, ArbitrationId], None]:
        """Detect tool changes."""
        # send request message once, to establish initial state
        attached_tool_request_message = message_definitions.AttachedToolsRequest(
            payload=payloads.EmptyPayload()
        )
        with self._reader as reader:
            await self._messenger.send(
                node_id=NodeId.host, message=attached_tool_request_message
            )
            async for response, arbitration_id in reader:
                if isinstance(response, message_definitions.AttachedToolsRequest):
                    yield (response, arbitration_id)
