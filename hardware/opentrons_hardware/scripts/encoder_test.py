"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
from numpy import float64
from logging.config import dictConfig

from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EncoderPositionRequest,
)

from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from opentrons_hardware.drivers.gpio import OT3GPIO

log = logging.getLogger(__name__)

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


async def run_move(messenger: CanMessenger) -> None:
    """Run the move."""
    # await messenger.send(node_id=NodeId.broadcast, message=EnableMotorRequest())
    samples = 1
    try:
        for x in range(1, samples+1):
            print(await messenger.send(node_id = NodeId.broadcast, message=EncoderPositionRequest()))
    except asyncio.CancelledError:
        pass


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with build.can_messenger(build_settings(args)) as messenger:
        # build a GPIO handler, which will automatically release estop
        gpio = OT3GPIO(__name__)
        gpio.deactivate_estop()
        await run_move(messenger)


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus move.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
