"""Firmware update script for the rear panel."""
import argparse
import asyncio
import logging
from logging.config import dictConfig
from typing import Dict, Any
from opentrons_hardware.firmware_update.run import RunUSBUpdate
from opentrons_hardware.drivers.binary_usb import (
    SerialUsbDriver,
    BinaryMessenger,
    build_rear_panel_messenger,
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


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    retry_count = args.retry_count
    timeout_seconds = args.timeout_seconds

    driver: SerialUsbDriver = build_rear_panel_messenger(asyncio.get_running_loop())

    messenger = BinaryMessenger(driver)
    messenger.start()
    updater = RunUSBUpdate(
        messenger=messenger,
        update_file=args.file,
        retry_count=retry_count,
        timeout_seconds=timeout_seconds,
    )
    success = await updater.run_update()
    logger.info(f"Rear panel update success: {success}")
    logger.info("Done")


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="FW Update.")

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
        "--less-logs",
        help="Set log level to INFO, so we see less logs.",
        action="store_true",
        default=False,
    )

    args = parser.parse_args()

    def _set_log_lvl_info(d: Dict[str, Any]) -> None:
        for k in d.keys():
            if isinstance(d[k], dict):
                _set_log_lvl_info(d[k])
            elif k == "level":
                d[k] = logging.INFO

    if args.less_logs:
        _set_log_lvl_info(LOG_CONFIG)
    dictConfig(LOG_CONFIG)

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
