"""Head tool detector."""

import asyncio
import logging
from opentrons_hardware.firmware_bindings.messages import message_definitions
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.hardware_control.tools.errors import ToolDetectionFailiure

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
            # await self.read() in abstract_driver __anext__ never
            # allows generator exhaustion
            if isinstance(message, message_definitions.PushToolsDetectedNotification):
                tmp_dic = {
                    Carrier.LEFT: ToolType(int(message.payload.a_motor.value)),
                    Carrier.RIGHT: ToolType(int(message.payload.z_motor.value)),
                }
                if self._attached_tools != tmp_dic:
                    self._attached_tools = tmp_dic
                    log.info("Tools detected %s:", {self._attached_tools})
                    yield tmp_dic

    async def run_detect(self) -> None:
        """Detect tool changes continuoulsy."""
        tool_generator = self.detect()
        async for tool in tool_generator:
            log.info(f"Detection, Tool: {tool}")

    async def run(self, retry_count: int, ready_wait_time_sec: float) -> None:
        """Detect tool changes continuously."""
        i = 1
        while True:
            try:
                await asyncio.wait_for(self.run_detect(), ready_wait_time_sec)
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
