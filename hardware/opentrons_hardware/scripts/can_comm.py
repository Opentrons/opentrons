"""A script for sending and monitoring CAN messages."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Optional, Callable, cast

from opentrons_hardware.drivers.can_bus import (
    CanDriver,
    MessageId,
    NodeId,
    CanMessage,
    ArbitrationId,
    ArbitrationIdParts,
    FunctionCode,
)
from opentrons_hardware.drivers.can_bus.messages.messages import get_definition
from opentrons_hardware.scripts.can_args import add_can_args
from opentrons_hardware.utils import BinarySerializable, BinarySerializableException

log = logging.getLogger(__name__)


GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


async def listen_task(can_driver: CanDriver) -> None:
    """A task that listens for can messages.

    Args:
        can_driver: Driver

    Returns: Nothing.

    """
    async for message in can_driver:
        log.info(f"Received <-- {message}")


def create_choices(enum_type: Type[Enum]) -> Sequence[str]:
    """Create choice strings.

    Args:
        enum_type: enum

    Returns:
        a collection of strings describing the choices in enum.

    """
    # mypy wants type annotation for v.
    return [f"{i}: {v.name}" for (i, v) in enumerate(enum_type)]  # type: ignore


def prompt_enum(
    enum_type: Type[Enum], get_user_input: GetInputFunc, output_func: OutputFunc
) -> Type[Enum]:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    output_func(f"choose {enum_type.__name__}:")
    for row in create_choices(enum_type):
        output_func(f"\t{row}")

    try:
        return list(enum_type)[int(get_user_input("enter choice: "))]
    except (ValueError, IndexError) as e:
        raise InvalidInput(str(e))


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
    for f in payload_fields:
        # TODO (amit 2021-10-01): Conversion to int is not good here long term.
        #  Should be handled by type coercion in utils.BinarySerializable.
        #  All values are ints now, but may be bytes in the future (ie serial
        #  numbers, fw upgrade blobs).
        try:
            i[f.name] = f.type.build(int(get_user_input(f"enter {f.name}: ")))
        except ValueError as e:
            raise InvalidInput(str(e))
    # Mypy is not liking constructing the derived types.
    return payload_type(**i)  # type: ignore


def prompt_message(get_user_input: GetInputFunc, output_func: OutputFunc) -> CanMessage:
    """Prompt user to create a message.

    Args:
        get_user_input: Function to get user input.
        output_func: Function to output text to user.

    Returns: a CanMessage
    """
    message_id = prompt_enum(MessageId, get_user_input, output_func)
    node_id = prompt_enum(NodeId, get_user_input, output_func)
    # TODO (amit, 2021-10-01): Get function code when the time comes.
    function_code = FunctionCode.network_management
    message_def = get_definition(cast(MessageId, message_id))
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
                message_id=message_id, node_id=node_id, function_code=function_code
            )
        ),
        data=data,
    )
    log.info(f"Sending --> {can_message}")
    return can_message


async def ui_task(can_driver: CanDriver) -> None:
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
            print(str(e))


async def run(interface: str, bitrate: int, channel: Optional[str] = None) -> None:
    """Entry point for script."""
    log.info(f"Connecting to {interface} {bitrate} {channel}")
    driver = await CanDriver.build(
        bitrate=bitrate, interface=interface, channel=channel
    )

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
    finally:
        driver.shutdown()


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": ("%(asctime)s %(name)s %(levelname)s %(message)s")}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "can_comm.log",
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

    asyncio.run(run(args.interface, args.bitrate, args.channel))


if __name__ == "__main__":
    main()
