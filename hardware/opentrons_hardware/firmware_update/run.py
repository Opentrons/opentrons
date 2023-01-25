"""Complete FW updater."""
import logging
import asyncio
from typing import Optional, TextIO, Dict, Tuple
from .types import FirmwareUpdateStatus

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateStartApp,
)
from opentrons_hardware.firmware_update import (
    FirmwareUpdateInitiator,
    FirmwareUpdateDownloader,
    FirmwareUpdateEraser,
    HexRecordProcessor,
)
from opentrons_hardware.firmware_update.target import Target

logger = logging.getLogger(__name__)

UpdateDict = Dict[NodeId, TextIO]
StatusDict = Dict[NodeId, Tuple[FirmwareUpdateStatus, int]]


class RunUpdate:
    """Class for updating robot microcontroller firmware."""

    def __init__(
        self,
        messenger: CanMessenger,
        update_details: UpdateDict,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
    ) -> None:
        """Initialize RunUpdate class.

        Args:
            messenger: The can messenger to use.
            update_details: Dict of nodes to be updated and their firmware files.
            retry_count: Number of times to retry.
            timeout_seconds: How much to wait for responses.
            erase: Whether to erase flash before updating.

        Returns:
            None
        """
        self._messenger = messenger
        self._update_details = update_details
        self._retry_count = retry_count
        self._timeout_seconds = timeout_seconds
        self._erase = erase
        self._status_dict = {
            node_id: (FirmwareUpdateStatus.queued, 0)
            for node_id in update_details.keys()
        }

    @staticmethod
    async def _run_update(
        messenger: CanMessenger,
        node_id: NodeId,
        hex_file: TextIO,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
    ) -> None:
        """Perform a firmware update on a node target."""
        hex_processor = HexRecordProcessor.from_file(hex_file)

        initiator = FirmwareUpdateInitiator(messenger)
        downloader = FirmwareUpdateDownloader(messenger)

        target = Target(system_node=node_id)

        logger.info(f"Initiating FW Update on {target}.")

        await initiator.run(
            target=target,
            retry_count=retry_count,
            ready_wait_time_sec=timeout_seconds,
        )
        if erase:
            eraser = FirmwareUpdateEraser(messenger)
            logger.info(f"Erasing existing FW Update on {target}.")
            await eraser.run(
                node_id=target.bootloader_node,
                timeout_sec=timeout_seconds,
            )
        else:
            logger.info("Skipping erase step.")

        logger.info(f"Downloading FW to {target.bootloader_node}.")
        await downloader.run(
            node_id=target.bootloader_node,
            hex_processor=hex_processor,
            ack_wait_seconds=timeout_seconds,
        )

        logger.info(f"Restarting FW on {target.system_node}.")
        await messenger.send(
            node_id=target.bootloader_node,
            message=FirmwareUpdateStartApp(),
        )

    async def run_updates(
        self,
    ) -> None:
        """Perform a firmware update on multiple node targets."""
        tasks = [
            self._run_update(
                messenger=self._messenger,
                node_id=node_id,
                hex_file=hex_file,
                retry_count=self._retry_count,
                timeout_seconds=self._timeout_seconds,
                erase=self._erase,
            )
            for node_id, hex_file in self._update_details.items()
        ]

        await asyncio.gather(*tasks)
