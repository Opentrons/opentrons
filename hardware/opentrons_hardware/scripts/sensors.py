"""A script for sending and receiving data from sensors on the OT3."""
import logging
import asyncio
import argparse
from enum import Enum
from typing import Type, Sequence, Callable, Tuple
from logging.config import dictConfig
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.drivers.can_bus.build import build_driver

from .sensor_utils import (
    SensorRun,
    handle_capacitive_sensor,
    handle_environment_sensor,
    handle_pressure_sensor,
)

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


def create_choices(enum_type: Type[Enum]) -> Sequence[str]:
    """Create choice strings.

    Args:
        enum_type: enum

    Returns:
        a collection of strings describing the choices in enum.

    """
    # mypy wants type annotation for v.
    return [f"{i}: {v.name}" for (i, v) in enumerate(enum_type)]  # type: ignore[var-annotated]  # noqa: E501


def prompt_sensor_type(
    get_user_input: GetInputFunc, output_func: OutputFunc
) -> SensorType:
    """Prompt to choose a member of the SensorType enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    output_func(f"choose {SensorType.__name__}:")
    for row in create_choices(SensorType):
        output_func(f"\t{row}")

    try:
        return list(SensorType)[int(get_user_input("enter sensor: "))]
    except (ValueError, IndexError) as e:
        raise InvalidInput(str(e))


def prompt_str_input(prompt_name: str, get_user_input: GetInputFunc) -> str:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    try:
        return str(get_user_input(f"type in {prompt_name}:"))
    except (ValueError, IndexError) as e:
        raise InvalidInput(str(e))


def prompt_int_input(prompt_name: str, get_user_input: GetInputFunc) -> int:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    try:
        return int(get_user_input(f"{prompt_name}:"))
    except (ValueError, IndexError) as e:
        raise InvalidInput(str(e))


def prompt_message(
    get_user_input: GetInputFunc, output_func: OutputFunc
) -> Tuple[SensorRun, bool]:
    """A list of all the information required to perform an initial sensor test."""
    sensor_type = prompt_sensor_type(get_user_input, output_func)
    pipette_serial_number = prompt_str_input("pipette serial number", get_user_input)
    pipette_mount = prompt_str_input(
        'pipette_mount if on robot, "left" or "right"', get_user_input
    )
    auto_zero = prompt_int_input("auto zero", get_user_input)
    minutes = prompt_int_input("script run time in minutes", get_user_input)
    output_to_csv = bool(prompt_int_input("output to csv?", get_user_input))

    sensor_run = SensorRun(
        sensor_type, pipette_serial_number, bool(auto_zero), minutes, pipette_mount
    )
    return sensor_run, output_to_csv


async def send_sensor_command(
    driver: AbstractCanDriver, command: SensorRun, csv: bool
) -> None:
    """Perform the specified sensor test located in utils.py."""
    if command.pipette_mount == "left":
        node = NodeId.pipette_left
    elif command.pipette_mount == "right":
        node = NodeId.pipette_right
    else:
        node = NodeId.broadcast
    if command.sensor_type == SensorType.pressure:
        await handle_pressure_sensor(command, driver, node, csv, log)
    elif command.sensor_type == SensorType.capacitive:
        await handle_capacitive_sensor(command, driver, node, csv, log)
    else:
        await handle_environment_sensor(command, driver, node, csv, log)


async def ui_task(can_driver: AbstractCanDriver) -> None:
    """UI task to create and send messages.

    Args:
        can_driver: Can driver.

    Returns: None.
    """
    while True:
        try:
            # Run sync prompt message in threadpool executor.
            sensor_command, to_csv = await asyncio.get_event_loop().run_in_executor(
                None, prompt_message, input, print
            )
            await send_sensor_command(can_driver, sensor_command, to_csv)
        except InvalidInput as e:
            print(str(e))


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))

    loop = asyncio.get_event_loop()
    task = loop.create_task(ui_task(driver))
    try:
        await task
    except KeyboardInterrupt:
        task.cancel()
    except asyncio.CancelledError:
        pass
    finally:
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
            "filename": "sensors.log",
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

    parser = argparse.ArgumentParser(description="Test communicating with sensors.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
