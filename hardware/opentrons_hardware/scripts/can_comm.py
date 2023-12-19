"""A script for sending CAN messages."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Callable, TypeVar

from opentrons_hardware.drivers.can_bus import build
from opentrons_hardware.drivers.gpio import OT3GPIO
from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId,
    FunctionCode,
)
from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.messages.messages import get_definition

from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.firmware_bindings.utils import (
    BinarySerializable,
    BinarySerializableException,
)

log = logging.getLogger(__name__)


GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


async def listen_task(can_driver: AbstractCanDriver) -> None:
    """A task that listens for can messages.

    Args:
        can_driver: Driver
    Returns: Nothing.
    """
    async for message in can_driver:
        message_definition = get_definition(
            MessageId(message.arbitration_id.parts.message_id)
        )
        if message_definition:
            try:
                build = message_definition.payload_type.build(message.data)
                log.info(f"Received <-- \n\traw: {message}, " f"\n\tparsed: {build}")
            except BinarySerializableException:
                log.exception(f"Failed to build from {message}")
        else:
            log.info(f"Received <-- \traw: {message}")


def create_choices(enum_type: Type[Enum]) -> Sequence[str]:
    """Create choice strings.

    Args:
        enum_type: enum

    Returns:
        a collection of strings describing the choices in enum.

    """
    # mypy wants type annotation for v.
    return [f"{i}: {v.name}" for (i, v) in enumerate(enum_type)]  # type: ignore[var-annotated]


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
    payload_type: Type[BinarySerializable], get_user_input: GetInputFunc
) -> BinarySerializable:
    """Prompt to get payload.

    Args:
        get_user_input: Function to get user input.
        payload_type: Serializable payload type.

    Returns:
        Serializable payload.

    """
    payload_fields = dataclasses.fields(payload_type)
    i = {}
    message_index = None
    for f in payload_fields:
        try:
            # we have to hack around message_index for now until we update to 3.10
            # then message index can work like everything else. see payloads.py
            if not (f.name == "message_index"):
                i[f.name] = f.type.from_string(
                    get_user_input(f"enter {f.name}: ").strip()
                )
            else:
                message_index = f.type.from_string(
                    get_user_input(f"enter {f.name}: ").strip()
                )
        except ValueError as e:
            raise InvalidInput(str(e))
    ret_instance = payload_type(**i)
    if message_index is not None:
        ret_instance.message_index = message_index  # type: ignore[attr-defined]
    return ret_instance


def prompt_message(
    get_user_input: GetInputFunc,
    output_func: OutputFunc,
    brief_prompt: bool = False,
) -> CanMessage:
    """Prompt user to create a message.

    Args:
        get_user_input: Function to get user input.
        output_func: Function to output text to user.
        brief_prompt: True to only write prompts if the user enters ?

    Returns: a CanMessage
    """
    message_id = prompt_enum(MessageId, get_user_input, output_func, brief_prompt)
    node_id = prompt_enum(NodeId, get_user_input, output_func, brief_prompt)
    # TODO (amit, 2021-10-01): Get function code when the time comes.
    function_code = FunctionCode.network_management
    message_def = get_definition(message_id)
    if message_def is None:
        raise InvalidInput(f"No message definition found for {message_id}")
    payload = prompt_payload(message_def.payload_type, get_user_input)
    try:
        data = payload.serialize()
    except BinarySerializableException as e:
        raise InvalidInput(str(e))
    can_message = CanMessage(
        arbitration_id=ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message_id,
                node_id=node_id,
                function_code=function_code,
                originating_node_id=NodeId.host,
            )
        ),
        data=data,
    )
    log.info(f"Sending --> \n\traw: {can_message}")
    return can_message


async def ui_task(can_driver: AbstractCanDriver) -> None:
    """UI task to create and send messages.

    Args:
        can_driver: Can driver.

    Returns: None.
    """
    while True:
        try:
            # Run sync prompt message in threadpool executor.
            can_message = await asyncio.get_event_loop().run_in_executor(
                None, prompt_message, input, print
            )
            await can_driver.send(can_message)
        except InvalidInput as e:
            log.exception("Invalid Input")
            print(in_red(str(e)))


async def run_ui(driver: AbstractCanDriver) -> None:
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
    # build a gpio handler which will automatically release estop
    gpio = OT3GPIO()
    gpio.deactivate_estop()
    async with build.driver(build_settings(args)) as driver:
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
            "filename": "/var/log/can_comm.log",
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

    parser = argparse.ArgumentParser(description="CAN bus testing.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
