"""Head tool detector."""

import logging
import queue
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
        self._queue = queue

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
        """Detect tool changes continuoulsy."""
        async for tool in self.detect():
            i = 1
            try:
                log.info(f"Detection {i}, Tool: {tool}")
                i += 1
            except StopIteration:
                raise ToolDetectionFailiure
