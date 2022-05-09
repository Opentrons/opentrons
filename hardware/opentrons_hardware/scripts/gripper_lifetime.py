"""A script for sending and receiving data from sensors on the OT3."""
import os
import logging
import asyncio
import argparse

from typing import Callable
from logging.config import dictConfig
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetupRequest,
    DisableMotorRequest,
    ExecuteMoveGroupRequest,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.hardware_control.gripper_settings import (
    set_reference_voltage,
    grip,
    home,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field


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


async def execute_move(messenger: CanMessenger) -> None:
    """Send an execute move command."""
    await messenger.send(
        node_id=NodeId.broadcast,
        message=ExecuteMoveGroupRequest(
            payload=payloads.ExecuteMoveGroupRequestPayload(
                group_id=UInt8Field(0),
                start_trigger=UInt8Field(0),
                cancel_trigger=UInt8Field(0),
            )
        ),
    )


def output_details(
    i: int, total_i: int) -> None:
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
    # await set_pwm_param(messenger, pwm_freq, pwm_duty)
    await messenger.send(node_id=NodeId.gripper, message=SetupRequest())

    """Setup gripper"""
    try:
        while True:
            for i in range(reps):
                output_details(i, reps)
                await grip(messenger, 0, 0, pwm_freq, pwm_duty)
                await execute_move(messenger)
                await asyncio.sleep(5.0)

                await home(messenger, 0, 0, pwm_freq, pwm_duty)
                await execute_move(messenger)
                print("finished")

    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.send(node_id=NodeId.gripper, message=DisableMotorRequest())
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
            "filename": "gripper.log",
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
