"""A script for sending and receiving data from sensors on the OT3."""
import logging
import asyncio
import argparse
from numpy import float64

from typing import Callable
from logging.config import dictConfig

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DisableMotorRequest,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteTipActionType
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.motion import (
    MoveGroupTipActionStep,
    MoveGroupSingleAxisStep,
    MoveStopCondition,
    create_home_step,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.current_settings import set_currents
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


async def run_plunger_motor(args: argparse.Namespace) -> None:
    """Entry point for plunger motor scripts."""
    print("Test plunger motor for the 96 channel\n")
    pipette_node = NodeId.pipette_left
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    home_plunger_runner = MoveGroupRunner(
        move_groups=[
            [
                create_home_step(
                    {pipette_node: float64(100.0)}, {pipette_node: float64(-args.speed)}
                )
            ]
        ]
    )
    # move specified distance in mm (default 30mm)
    duration = round(abs(args.distance / args.speed), 4)
    move_plunger_runner = MoveGroupRunner(
        # Group 0
        move_groups=[
            [
                {
                    pipette_node: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(args.speed),
                        duration_sec=float64(duration),
                    )
                }
            ]
        ],
    )
    try:
        currents = {pipette_node: (float(args.hold_current), float(args.run_current))}
        await set_currents(messenger, currents)
        input("Hit enter to continue to home the plunger motor")
        await home_plunger_runner.run(can_messenger=messenger)
        input("Hit enter to continue to move the motor down 30 mm")
        await move_plunger_runner.run(can_messenger=messenger)
    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.send(node_id=pipette_node, message=DisableMotorRequest())
        await messenger.stop()
        driver.shutdown()

    return None


async def run_gear_motors(args: argparse.Namespace) -> None:
    """Entry point for gear motor scripts."""
    print("Test tip pick up motors for the 96 channel\n")
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
                        velocity_mm_sec=float64(-5.0),
                        acceleration_mm_sec_sq=float64(0),
                        duration_sec=float64(6),
                        stop_condition=MoveStopCondition.limit_switch,
                        action=PipetteTipActionType.home,
                    )
                }
            ]
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

    try:
        # Home the gear motors and Z before performing the test
        await home_z.run(can_messenger=messenger)

        currents = {pipette_node: (float(args.hold_current), float(args.run_current))}
        await set_currents(
            messenger, currents, use_tip_motor_message_for=[pipette_node]
        )
        await drop_tip_runner.run(can_messenger=messenger)
        await asyncio.sleep(0.1)
        # # Move to the tiprack
        for i in range(reps):
            output_details(i, reps)
            log.info(f"*********** Now executing round {i} / {reps}")
            # Pick up tips
            await pick_up_tip_runner.run(can_messenger=messenger)
            await asyncio.sleep(delay)
            input("Drop Tip")
            # Drop the tips
            await drop_tip_runner.run(can_messenger=messenger)
            await asyncio.sleep(delay)
            input("Pick up Tip")
    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.send(node_id=pipette_node, message=DisableMotorRequest())
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
            "filename": "/var/log/HT_diagnostics.log",
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
    parser.add_argument(
        "--use_plunger",
        type=bool,
        help="If true, move the plunger motors otherwise move the gear motors",
        default=False,
    )
    parser.add_argument(
        "--run_current",
        type=float,
        help="Active current of the plunger",
        default=1.5,
    )
    parser.add_argument(
        "--hold_current",
        type=float,
        help="Dwell current of the plunger",
        default=0.8,
    )
    parser.add_argument(
        "--speed",
        type=float,
        help="The speed with which to move the plunger",
        default=10.5,
    )
    parser.add_argument(
        "--distance",
        type=float,
        help="The distance in mm to move the plunger",
        default=30,
    )

    args = parser.parse_args()

    if args.use_plunger:
        asyncio.run(run_plunger_motor(args))
    else:
        asyncio.run(run_gear_motors(args))


if __name__ == "__main__":
    main()
