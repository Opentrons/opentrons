"""A script for sending and receiving data from sensors on the OT3."""
import logging
import asyncio
import argparse
from numpy import float64

from typing import Callable
from logging.config import dictConfig

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteTipActionType
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.motion import (
    MoveGroupTipActionStep,
    MoveGroupSingleAxisStep,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons_hardware.drivers.can_bus.build import build_driver


GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


def prompt_int_input(prompt_name: str) -> int:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    try:
        return int(input(f"{prompt_name}: "))
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)


def output_details(i: int, total_i: int) -> None:
    """Print out test details."""
    print(f"\n\033[95mRound {i}/{total_i}:\033[0m")


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    print("Test tip pick up for the 96 channel\n")
    reps = prompt_int_input("Number of repetitions for pick up and drop tip")
    delay = prompt_int_input("Delay in seconds between pick up and drop tip")
    # 96 channel can only be mounted to the left
    pipette_node = NodeId.pipette_left

    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver=driver)
    messenger.start()

    pick_up_tip_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    pipette_node: MoveGroupTipActionStep(
                        velocity_mm_sec=float64(5.5),
                        acceleration_mm_sec_sq=float64(0),
                        duration_sec=float64(2.5),
                        stop_condition=MoveStopCondition.none,
                        action=PipetteTipActionType.clamp,
                    )
                }
            ]
        ]
    )
    drop_tip_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    pipette_node: MoveGroupTipActionStep(
                        velocity_mm_sec=float64(-5.5),
                        acceleration_mm_sec_sq=float64(0),
                        duration_sec=float64(6),
                        stop_condition=MoveStopCondition.limit_switch,
                        action=PipetteTipActionType.home,
                    )
                }
            ]
        ]
    )

    move_tip_runner = MoveGroupRunner(
        move_groups=[
            # Group 0
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(-10.5),
                        duration_sec=float64(6),
                    )
                }
            ],
            # Group 1
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(10.5),
                        duration_sec=float64(6),
                    )
                }
            ],
        ]
    )
    home_z = MoveGroupRunner(
        move_groups=[
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(-10.5),
                        duration_sec=float64(100),
                        stop_condition=MoveStopCondition.limit_switch,
                    )
                }
            ]
        ]
    )

    initial_z = MoveGroupRunner(
        move_groups=[
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(10.5),
                        duration_sec=float64(10.86),
                    )
                }
            ]
        ]
    )
    try:
        # Home the gear motors and Z before performing the test
        await drop_tip_runner.run(can_messenger=messenger)
        await home_z.run(can_messenger=messenger)
        await asyncio.sleep(1)
        # Move to the tiprack
        await initial_z.run(can_messenger=messenger)
        for i in range(reps):
            output_details(i, reps)
            log.info(f"*********** Now executing round {i} / {reps}")
            # Pick up tips
            await pick_up_tip_runner.run(can_messenger=messenger)
            await asyncio.sleep(delay)
            # Move the tips up and down to test seal
            await move_tip_runner.run(can_messenger=messenger)
            await asyncio.sleep(delay)
            # Drop the tips
            await drop_tip_runner.run(can_messenger=messenger)
            await asyncio.sleep(delay)
    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.stop()
        driver.shutdown()


log = logging.getLogger(__name__)

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
            "filename": "/var/log/HT_tip_handling.log",
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

    parser = argparse.ArgumentParser(
        description="96 channel tip handling testing script."
    )
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
