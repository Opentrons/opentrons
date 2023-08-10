"""A script for sending and receiving data from sensors on the OT3."""
import os
import logging
import asyncio
import argparse
from numpy import float32, float64, int32

from typing import Callable
from logging.config import dictConfig

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleGripperStep,
    MoveType,
    MoveGroups,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.hardware_control.gripper_settings import (
    set_reference_voltage,
)


GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]

vref_list = [0.01, 0.05, 0.1, 0.2]  # in A


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


def prompt_float_input(prompt_name: str) -> float:
    """Prompt for a float."""
    try:
        return float(input(f"{prompt_name}: "))
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)


def in_green(s: str) -> str:
    """Return string formatted in red."""
    return f"\033[92m{str(s)}\033[0m"


def output_details(i: int, total_i: int) -> None:
    """Print out test details."""
    print(f"\n\033[95mRound {i}/{total_i}:\033[0m")


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    os.system("cls")
    os.system("clear")

    print("Gripper Life Cycle testing beings... \n")
    reps = prompt_int_input("Number of repetitions open & close (int)")
    vref = prompt_float_input("Vref in A (float)")
    pwm_freq = prompt_int_input("PWM frequency in Hz (int)")
    pwm_duty = prompt_int_input("PWM duty cycle in % (int)")

    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver=driver)
    messenger.start()
    await set_reference_voltage(messenger, vref)
    await messenger.send(node_id=NodeId.gripper_g, message=EnableMotorRequest())

    move_groups: MoveGroups = []
    move_groups.append(
        [
            {
                NodeId.gripper_g: MoveGroupSingleGripperStep(
                    duration_sec=float64(3),
                    pwm_frequency=float32(pwm_freq),
                    pwm_duty_cycle=float32(pwm_duty),
                    encoder_position_um=int32(0),
                    stay_engaged=True,
                )
            }
        ]
    )
    move_groups.append(
        [
            {
                NodeId.gripper_g: MoveGroupSingleGripperStep(
                    duration_sec=float64(3),
                    pwm_frequency=float32(pwm_freq),
                    pwm_duty_cycle=float32(pwm_duty),
                    move_type=MoveType.home,
                    encoder_position_um=int32(0),
                )
            }
        ]
    )
    assert len(move_groups) == 2

    runner = MoveGroupRunner(move_groups=move_groups)
    try:
        for i in range(reps):
            output_details(i, reps)
            log.info(f"*********** Now executing round {i} / {reps}")
            await runner.run(can_messenger=messenger)
            await asyncio.sleep(1.0)  # Change this value to adjust pause
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
            "filename": "/var/log/gripper.log",
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

    parser = argparse.ArgumentParser(description="Gripper testing script.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
