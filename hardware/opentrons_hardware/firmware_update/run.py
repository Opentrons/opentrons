"""Complete FW updater."""
import logging
import asyncio
from typing import Optional, TextIO, Dict

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


async def run_update(
    messenger: CanMessenger,
    node_id: NodeId,
    hex_file: TextIO,
    retry_count: int,
    timeout_seconds: float,
    erase: Optional[bool] = True,
) -> None:
    """Perform a firmware update on a node target.

    Args:
        messenger: The can messenger to use.
        node_id: The node being updated.
        hex_file: File containing firmware.
        retry_count: Number of times to retry.
        timeout_seconds: How much to wait for responses.
        erase: Whether to erase flash before updating.

    Returns:
        None
    """
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


UpdateDict = Dict[NodeId, TextIO]


async def run_updates(
    messenger: CanMessenger,
    update_details: UpdateDict,
    retry_count: int,
    timeout_seconds: float,
    erase: Optional[bool] = True,
) -> None:
    """Perform a firmware update on multiple node targets.

    Args:
        messenger: The can messenger to use.
        update_details: Dict of nodes to be updated and their firmware files.
        retry_count: Number of times to retry.
        timeout_seconds: How much to wait for responses.
        erase: Whether to erase flash before updating.

    Returns:
        None
    """
    tasks = [
        run_update(
            messenger=messenger,
            node_id=node_id,
            hex_file=hex_file,
            retry_count=retry_count,
            timeout_seconds=timeout_seconds,
            erase=erase,
        )
        for node_id, hex_file in update_details.items()
    ]

    await asyncio.gather(*tasks)
