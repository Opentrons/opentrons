"""Firmware eraser."""
import asyncio

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_bindings import NodeId, ErrorCode
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateEraseAppRequest,
    FirmwareUpdateEraseAppResponse,
)
from opentrons_hardware.firmware_update.errors import ErrorResponse, TimeoutResponse


class FirmwareUpdateEraser:
    """Class that can erase an application firmware."""

    def __init__(self, can_messenger: CanMessenger) -> None:
        """Constructor.

        Args:
            can_messenger: Can messenger
        """
        self._can_messenger = can_messenger

    async def run(self, node_id: NodeId, timeout_sec: float) -> None:
        """Send command to erase the firmware.

        Args:
            node_id: Bootloader node id
            timeout_sec: Number of seconds between retries.

        Returns:
            None.
        """
        with WaitableCallback(self._can_messenger) as reader:
            request = FirmwareUpdateEraseAppRequest()
            await self._can_messenger.send(node_id=node_id, message=request)
            try:
                await asyncio.wait_for(
                    self._wait_response(node_id, reader), timeout_sec
                )
            except asyncio.TimeoutError:
                raise TimeoutResponse(request, node_id)

    @staticmethod
    async def _wait_response(node_id: NodeId, reader: WaitableCallback) -> None:
        """Wait for response."""
        # Poll for device info response.
        async for response, arbitration_id in reader:
            if (
                isinstance(response, FirmwareUpdateEraseAppResponse)
                and arbitration_id.parts.originating_node_id == node_id
            ):
                if response.payload.error_code.value != ErrorCode.ok:
                    raise ErrorResponse(response, node_id)
                else:
                    break
