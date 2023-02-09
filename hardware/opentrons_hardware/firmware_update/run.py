"""Complete FW updater."""
import logging
import asyncio
import os
from typing import Optional, Dict, Tuple, AsyncIterator
from .types import FirmwareUpdateStatus, StatusElement

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
from opentrons_hardware.firmware_update.errors import BootloaderNotReady
from opentrons_hardware.firmware_update.target import Target

logger = logging.getLogger(__name__)


class RunUpdate:
    """Class for updating robot microcontroller firmware."""

    def __init__(
        self,
        messenger: CanMessenger,
        update_details: Dict[NodeId, str],
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
        self._status_queue: "asyncio.Queue[Tuple[NodeId,StatusElement]]" = (
            asyncio.Queue()
        )

    async def _run_update(
        self,
        messenger: CanMessenger,
        node_id: NodeId,
        filepath: str,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
    ) -> None:
        """Perform a firmware update on a node target."""
        if not os.path.exists(filepath):
            print("Subsystem update file not found {filepath}")
            raise FileNotFoundError

        with open(filepath) as f:
            hex_processor = HexRecordProcessor.from_file(f)

            initiator = FirmwareUpdateInitiator(messenger)
            downloader = FirmwareUpdateDownloader(messenger)

            target = Target(system_node=node_id)

            logger.info(f"Initiating FW Update on {target}.")
            await self._status_queue.put((node_id, (FirmwareUpdateStatus.updating, 0)))

            await initiator.run(
                target=target,
                retry_count=retry_count,
                ready_wait_time_sec=timeout_seconds,
            )
            download_start_progress = 0.1
            await self._status_queue.put(
                (node_id, (FirmwareUpdateStatus.updating, download_start_progress))
            )

            if erase:
                eraser = FirmwareUpdateEraser(messenger)
                logger.info(f"Erasing existing FW Update on {target}.")

                try:
                    await eraser.run(
                        node_id=target.bootloader_node,
                        timeout_sec=timeout_seconds,
                    )
                    download_start_progress = 0.2
                    await self._status_queue.put(
                        (
                            node_id,
                            (FirmwareUpdateStatus.updating, download_start_progress),
                        )
                    )
                except BootloaderNotReady as e:
                    logger.error(f"Firmware Update failed for {target} {e}.")
                    await self._status_queue.put(
                        (
                            node_id,
                            (FirmwareUpdateStatus.updating, download_start_progress),
                        )
                    )
                    return
            else:
                logger.info("Skipping erase step.")

            logger.info(f"Downloading FW to {target.bootloader_node}.")
            async for download_progress in downloader.run(
                node_id=target.bootloader_node,
                hex_processor=hex_processor,
                ack_wait_seconds=timeout_seconds,
            ):
                await self._status_queue.put(
                    (
                        node_id,
                        (
                            FirmwareUpdateStatus.updating,
                            download_start_progress
                            + (0.9 - download_start_progress) * download_progress,
                        ),
                    )
                )

            logger.info(f"Restarting FW on {target.system_node}.")
            await messenger.send(
                node_id=target.bootloader_node,
                message=FirmwareUpdateStartApp(),
            )
            await self._status_queue.put((node_id, (FirmwareUpdateStatus.done, 1)))

    async def run_updates(
        self,
    ) -> AsyncIterator[Tuple[NodeId, StatusElement]]:
        """Perform a firmware update on multiple node targets."""
        tasks = [
            self._run_update(
                messenger=self._messenger,
                node_id=node_id,
                filepath=filepath,
                retry_count=self._retry_count,
                timeout_seconds=self._timeout_seconds,
                erase=self._erase,
            )
            for node_id, filepath in self._update_details.items()
        ]

        task = asyncio.gather(*tasks)
        while True:
            try:
                yield await asyncio.wait_for(self._status_queue.get(), 0.25)
            except asyncio.TimeoutError:
                pass
            if task.done():
                break
