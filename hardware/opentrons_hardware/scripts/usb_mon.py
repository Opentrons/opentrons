"""A script for sending CAN messages."""
import asyncio
import logging
import argparse
from logging.config import dictConfig
from typing import Callable

from opentrons_hardware.drivers.binary_usb import build

from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver

log = logging.getLogger(__name__)


GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


async def listen_task(usb_driver: SerialUsbDriver) -> None:
    """A task that listens for can messages.

    Args:
        usb_driver: Driver
    Returns: Nothing.
    """
    async for message in usb_driver:
        if message is not None:
            log.info(f"Received <-- \traw: {message}")
            print(f"Received <-- \traw: {message}")


async def run_ui(driver: SerialUsbDriver) -> None:
    """Run the UI."""
    loop = asyncio.get_event_loop()
    fut = asyncio.gather(loop.create_task(listen_task(driver)))
    try:
        await fut
    except KeyboardInterrupt:
        fut.cancel()
    except asyncio.CancelledError:
        pass


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with build.usb_driver() as driver:
        await (run_ui(driver))


def in_red(s: str) -> str:
    """Return string formatted in red."""
    return f"\033[1;31;40m{str(s)}\033[0m"


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/var/log/usb_mon.log",
            "maxBytes": 5000000,
            "level": logging.INFO,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.INFO,
        },
    },
}


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="USB bus testing.")

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
