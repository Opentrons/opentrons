"""Firmware update initiation."""

import asyncio
import logging

from opentrons_hardware.firmware_bindings.messages import message_definitions

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_update.target import Target
from opentrons_hardware.firmware_update.errors import BootloaderNotReady

logger = logging.getLogger(__name__)


class FirmwareUpdateInitiator:
    """Class that initiates a FW update."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

    async def run(
        self, target: Target, retry_count: int, ready_wait_time_sec: float
    ) -> None:
        """Initiate FW update for target.

        Args:
            target: The system that should be updated.
            retry_count: How many times to try.
            ready_wait_time_sec: How long to wait for bootloader to be ready.

        Returns:
            None
        """
        with WaitableCallback(self._messenger) as reader:
            logger.info("initiate: acquiring exclusive")
            async with self._messenger.exclusive_writer:
                logger.info("initiate: acquired exclusive")
                # Create initiate message
                initiate_message = message_definitions.FirmwareUpdateInitiate()
                # Send it to system node
                await self._messenger.send_exclusive(
                    node_id=target.system_node, message=initiate_message
                )
                # and to bootloader node. Just in case we're already in bootloader mode.
                await self._messenger.send_exclusive(
                    node_id=target.bootloader_node, message=initiate_message
                )

                i = 1
                while True:
                    try:
                        await asyncio.wait_for(
                            self._wait_bootloader(reader, target), ready_wait_time_sec
                        )
                        break
                    except asyncio.TimeoutError:
                        logger.warning(
                            f"Try {i}: Bootloader not ready "
                            f"after {ready_wait_time_sec} seconds."
                        )
                        if i < retry_count:
                            i += 1
                        else:
                            raise BootloaderNotReady()
            logger.info("initiate: released exclusive")

    async def _wait_bootloader(self, reader: WaitableCallback, target: Target) -> None:
        """Wait for bootloader to be ready."""
        # Send device info request
        device_info_request_message = message_definitions.DeviceInfoRequest()
        await self._messenger.send_exclusive(
            node_id=target.bootloader_node, message=device_info_request_message
        )
        # Poll for device info response.
        async for response, arbitration_id in reader:
            if (
                isinstance(response, message_definitions.DeviceInfoResponse)
                and arbitration_id.parts.originating_node_id == target.bootloader_node
            ):
                break
