"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
from logging.config import dictConfig
from typing import Optional

from opentrons_hardware.drivers.can_bus import CanDriver
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetupRequest,
    EnableMotorRequest,
)
from opentrons_hardware.hardware_control.motion import MoveGroupSingleAxisStep
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args


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


async def run(interface: str, bitrate: int, channel: Optional[str] = None) -> None:
    """Entry point for script."""
    log.info(f"Connecting to {interface} {bitrate} {channel}")
    driver = await CanDriver.build(
        bitrate=bitrate, interface=interface, channel=channel
    )
    messenger = CanMessenger(driver=driver)
    messenger.start()

    await messenger.send(node_id=NodeId.broadcast, message=SetupRequest())
    await messenger.send(node_id=NodeId.broadcast, message=EnableMotorRequest())

    # TODO (al, 2021-11-11): Allow creating groups from command line or config file.
    move_groups = [
        # Group 0
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=5000.5, duration_sec=3
                ),
            },
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=5000.5, duration_sec=3
                ),
            },
        ],
        # Group 1
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=2000.25, duration_sec=3
                ),
            },
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=1000.5, duration_sec=3
                ),
            },
        ],
    ]

    runner = MoveGroupRunner(move_groups=move_groups)

    try:
        await runner.run(can_messenger=messenger)
    except asyncio.CancelledError:
        pass
    finally:
        await messenger.stop()
        driver.shutdown()


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus move.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args.interface, args.bitrate, args.channel))


if __name__ == "__main__":
    main()
