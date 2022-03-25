"""Complete FW updater."""
import logging
from typing import Optional

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import \
    FirmwareUpdateStartApp
from opentrons_hardware.firmware_update import FirmwareUpdateInitiator, \
    FirmwareUpdateDownloader, FirmwareUpdateEraser, HexRecordProcessor, Target


logger = logging.getLogger(__name__)


async def run_update(
        messenger: CanMessenger,
        target: Target,
        hex_processor: HexRecordProcessor,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True) -> None:
    """Perform a firmware update on a node target.

    Args:
        messenger: The can messenger to use
        target: The node being updated
        hex_processor: The producer of
        retry_count: Number of times to retry.
        timeout_seconds: How much to wait for responses.
        erase: Whether to erase flash before updating.

    Returns:
        None
    """
    initiator = FirmwareUpdateInitiator(messenger)
    downloader = FirmwareUpdateDownloader(messenger)

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
