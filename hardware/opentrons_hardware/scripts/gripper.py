"""A script for sending and receiving data from sensors on the OT3."""
import os
import logging
import asyncio
import argparse

from typing import Callable
from logging.config import dictConfig

from opentrons_hardware.drivers.can_bus import build
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DisableMotorRequest,
    ExecuteMoveGroupRequest,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.gripper_settings import (
    set_pwm_param,
    set_reference_voltage,
    grip,
    home,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.hardware_control.constants import (
    brushed_motor_interrupts_per_sec,
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


def output_details(i: int, duty_cycle: int, v_ref: float) -> None:
    """Print out test details."""
    print(f"\n\033[95mRound {i}:\033[0m")
    print("--------")
    print(f"V_ref: {v_ref * 100} mA")
    print(f"PWM: {brushed_motor_interrupts_per_sec}Hz {duty_cycle}%\n")


async def run_test(messenger: CanMessenger) -> None:
    """Run the for test."""
    print("Gripper testing begins... \n")
    pwm_duty = prompt_int_input("PWM duty cycle in % (int)")

    """Setup gripper"""
    try:
        await set_pwm_param(messenger, pwm_duty)

        for i, v in enumerate(vref_list):
            await set_reference_voltage(messenger, v)
            output_details(i, pwm_duty, v)

            input(in_green("Press Enter to grip...\n"))

            await grip(messenger, 0, 0, 0, 0)
            await execute_move(messenger)

            input(in_green("Press Enter to release...\n"))

            await home(messenger, 0, 0, 0)
            await execute_move(messenger)

    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.send(node_id=NodeId.gripper, message=DisableMotorRequest())


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    os.system("cls")
    os.system("clear")

    async with build.can_messenger(build_settings(args)) as messenger:
        await run_test(messenger)


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
