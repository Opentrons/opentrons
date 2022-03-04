"""Firmware update script."""
import argparse
import asyncio
import logging
from logging.config import dictConfig
from pathlib import Path

from typing_extensions import Final

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateStartApp,
)
from opentrons_hardware.firmware_bindings.messages.payloads import EmptyPayload
from .can_args import add_can_args, build_settings
from opentrons_hardware.firmware_update import (
    FirmwareUpdateDownloader,
    FirmwareUpdateInitiator,
    head,
    gantry_x,
    gantry_y,
    pipette_left,
    pipette_right,
    HexRecordProcessor,
    FirmwareUpdateEraser,
)

logger = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}

TARGETS: Final = {
    "head": head,
    "gantry-x": gantry_x,
    "gantry-y": gantry_y,
    "pipette-left": pipette_left,
    "pipette-right": pipette_right,
}


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    target = TARGETS[args.target]

    hex_processor = HexRecordProcessor.from_file(Path(args.file))

    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver)
    messenger.start()

    initiator = FirmwareUpdateInitiator(messenger)
    downloader = FirmwareUpdateDownloader(messenger)

    logger.info(f"Initiating FW Update on {target}.")
    await initiator.run(
        target=target,
        retry_count=args.retry_count,
        ready_wait_time_sec=args.timeout_seconds,
    )

    if not args.no_erase:
        eraser = FirmwareUpdateEraser(messenger)
        logger.info(f"Erasing existing FW Update on {target}.")
        await eraser.run(
            node_id=target.bootloader_node,
            timeout_sec=args.timeout_seconds,
        )
    else:
        logger.info("Skipping erase step.")

    logger.info(f"Downloading FW to {target.bootloader_node}.")
    await downloader.run(
        node_id=target.bootloader_node,
        hex_processor=hex_processor,
        ack_wait_seconds=args.timeout_seconds,
    )

    logger.info(f"Restarting FW on {target.system_node}.")
    await messenger.send(
        node_id=target.bootloader_node,
        message=FirmwareUpdateStartApp(),
    )

    await messenger.stop()

    logger.info("Done")


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="FW Update.")
    add_can_args(parser)

    parser.add_argument(
        "--target",
        help="The FW subsystem to be updated.",
        type=str,
        required=True,
        choices=TARGETS.keys(),
    )
    parser.add_argument(
        "--file",
        help="Path to hex file containing the FW executable.",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--retry-count",
        help="Number of times to retry bootloader detection.",
        type=int,
        default=3,
    )
    parser.add_argument(
        "--timeout-seconds", help="Number of seconds to wait.", type=float, default=10
    )
    parser.add_argument(
        "--no-erase",
        help="Don't erase existing application from flash.",
        action="store_true",
        default=False,
    )

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
