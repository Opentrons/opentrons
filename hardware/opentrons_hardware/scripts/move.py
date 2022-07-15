"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
from numpy import float64
from logging.config import dictConfig

from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
)
from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    MoveGroups,
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
    await messenger.send(node_id=NodeId.broadcast, message=EnableMotorRequest())

    # TODO (al, 2021-11-11): Allow creating groups from command line or config file.
    move_groups: MoveGroups = [
        # Group 0
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(5000.5),
                    duration_sec=float64(3),
                ),
            },
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(5000.5),
                    duration_sec=float64(3),
                ),
            },
        ],
        # Group 1
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(2000.25),
                    duration_sec=float64(3),
                ),
            },
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(1000.5),
                    duration_sec=float64(3),
                ),
            },
        ],
    ]

    runner = MoveGroupRunner(move_groups=move_groups)

    try:
        await runner.run(can_messenger=messenger)
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
