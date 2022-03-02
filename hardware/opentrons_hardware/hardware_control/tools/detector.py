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
        async for message in self._messenger._driver:
            if isinstance(message, message_definitions.PushToolsDetectedNotification):
                tmp_dic = {
                    Carrier.A_CARRIER: ToolType(int(message.payload.a_motor.value)),
                    Carrier.Z_CARRIER: ToolType(int(message.payload.z_motor.value)),
                    Carrier.GRIPPER_CARRIER: ToolType(
                        int(message.payload.gripper.value)
                    ),
                }
                self._attached_tools = tmp_dic
                log.info("Tools detected %s:", {str(self._attached_tools)})
                yield tmp_dic

    async def run_detect(self) -> None:
        """Detect tool changes."""
        tool_generator = self.detect()
        tool = await tool_generator.__anext__()
        log.info(f"Detection, Tool: {tool}")

    async def run(
        self,
        retry_count: int,
        ready_wait_time_sec: float,
    ) -> None:
        """Detect tool changes."""
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
