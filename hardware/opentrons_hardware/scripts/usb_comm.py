"""A script for sending CAN messages."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Callable, TypeVar

from opentrons_hardware.drivers.binary_usb import build
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId

from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.firmware_bindings.messages import (
    get_binary_definition,
    BinaryMessageDefinition,
)

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


def create_choices(enum_type: Type[Enum]) -> Sequence[str]:
    """Create choice strings.

    Args:
        enum_type: enum

    Returns:
        a collection of strings describing the choices in enum.

    """
    # mypy wants type annotation for v.
    return [f"{i}: {v.name}" for (i, v) in enumerate(enum_type)]


PromptedEnum = TypeVar("PromptedEnum", bound=Enum, covariant=True)


def prompt_enum(  # noqa: C901
    enum_type: Type[PromptedEnum],
    get_user_input: GetInputFunc,
    output_func: OutputFunc,
    brief_prompt: bool = False,
) -> PromptedEnum:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type
        brief_prompt: use succinct prompt

    Returns:
        The choice.

    """

    def write_choices() -> None:
        output_func(f"choose {enum_type.__name__}:")
        for row in create_choices(enum_type):
            output_func(f"\t{row}")

    def parse_input(userstr: str) -> PromptedEnum:
        try:
            return list(enum_type)[int(userstr)]
        except (ValueError, IndexError) as e:
            raise InvalidInput(str(e))

    if not brief_prompt:
        write_choices()
    while True:
        user = (
            get_user_input(f"choose {enum_type.__name__} (? for list): ")
            .lower()
            .strip()
        )
        if not user:
            continue
        if "?" in user:
            write_choices()
            continue
        try:
            return parse_input(user)
        except InvalidInput as e:
            log.exception("Invalid Input")
            output_func(in_red(str(e)) + "\n")


def prompt_payload(
    payload_type: Type[BinaryMessageDefinition], get_user_input: GetInputFunc
) -> BinaryMessageDefinition:
    """Prompt to get payload.

    Args:
        get_user_input: Function to get user input.
        payload_type: Serializable payload type.

    Returns:
        Serializable payload.

    """
    payload_fields = dataclasses.fields(payload_type)
    i = {}
    for f in payload_fields:
        try:
            if not f.name == "message_id":
                i[f.name] = f.type.from_string(
                    get_user_input(f"enter {f.name}: ").strip()
                )
            else:
                i[f.name] = payload_type.message_id
        except ValueError as e:
            raise InvalidInput(str(e))
    # Mypy is not liking constructing the derived types.
    ret_instance = payload_type(**i)
    return ret_instance


def prompt_message(
    get_user_input: GetInputFunc,
    output_func: OutputFunc,
    brief_prompt: bool = False,
) -> BinaryMessageDefinition:
    """Prompt user to create a message.

    Args:
        get_user_input: Function to get user input.
        output_func: Function to output text to user.
        brief_prompt: True to only write prompts if the user enters ?

    Returns: a CanMessage
    """
    message_id = prompt_enum(BinaryMessageId, get_user_input, output_func, brief_prompt)
    message_def = get_binary_definition(message_id)
    if message_def is None:
        raise InvalidInput(f"No message definition found for {message_id}")
    payload = prompt_payload(message_def, get_user_input)

    log.info(f"Sending --> \n\traw: {payload}")
    return message_def.build(payload.serialize())  # type: ignore[return-value]


async def ui_task(usb_driver: SerialUsbDriver) -> None:
    """UI task to create and send messages.

    Args:
        usb_driver: binary over usb message driver.

    Returns: None.
    """
    while True:
        try:
            # Run sync prompt message in threadpool executor.
            usb_message = await asyncio.get_event_loop().run_in_executor(
                None, prompt_message, input, print
            )
            await usb_driver.write(usb_message)
        except InvalidInput as e:
            log.exception("Invalid Input")
            print(in_red(str(e)))


async def run_ui(driver: SerialUsbDriver) -> None:
    """Run the UI."""
    loop = asyncio.get_event_loop()
    fut = asyncio.gather(
        loop.create_task(listen_task(driver)), loop.create_task(ui_task(driver))
    )
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
            "filename": "/var/log/usb_comm.log",
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
