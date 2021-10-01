"""A script for sending and monitoring CAN messages."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Optional

from opentrons_hardware.drivers.can_bus import CanDriver, MessageId, NodeId, \
    CanMessage, ArbitrationId, ArbitrationIdParts
from opentrons_hardware.drivers.can_bus.messages.messages import get_definition
from opentrons_hardware.scripts.can_args import add_can_args
from opentrons_hardware.utils import BinarySerializable

log = logging.getLogger(__name__)


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
    return [f"{i}: {v.name}" for (i, v) in enumerate(enum_type)]


def prompt_enum(enum_type: Type[Enum]) -> Type[Enum]:
    """Prompt to choose a member of the enum.

    Args:
        enum_type: an enum type

    Returns:
        The choice.

    """
    print(f"choose {enum_type}:")
    for row in create_choices(enum_type):
        print(f"\t{row}")

    return list(enum_type)[int(input("enter choice:"))]


def prompt_payload(payload_type: Type[BinarySerializable]) -> BinarySerializable:
    """Prompt to get payload.

    Args:
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
        i[f.name] = f.type.build(int(input(f"enter {f.name}:")))
    return payload_type(**i)


async def ui_task(can_driver: CanDriver) -> None:
    """UI task to create and send messages.

    Args:
        can_driver: Can driver.

    Returns: None.
    """
    while True:
        message_id = prompt_enum(MessageId)
        node_id = prompt_enum(NodeId)
        # TODO (amit, 2021-10-01): Get function code when the time comes.
        message_def = get_definition(message_id)

        payload = prompt_payload(message_def.payload_type)

        can_message = CanMessage(
            arbitration_id=ArbitrationId(parts=ArbitrationIdParts(message_id=message_id, node_id=node_id, function_code=0)),
            data=payload.serialize(),
        )

        log.info(f"Sending --> {can_message}")

        await can_driver.send(can_message)


async def run(interface: str, bitrate: int, channel: Optional[str] = None) -> None:
    """Entry point for script."""
    log.info(f"Connecting to {interface} {bitrate} {channel}")
    driver = await CanDriver.build(
        bitrate=bitrate, interface=interface, channel=channel
    )

    loop = asyncio.get_event_loop()
    lt = loop.create_task(listen_task(driver))
    ui = loop.create_task(ui_task(driver))

    try:
        await lt
        await ui
    except KeyboardInterrupt:
        lt.cancel()
        ui.cancel()
    finally:
        driver.shutdown()


LOG_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {
                "format": (
                    "%(asctime)s %(name)s %(levelname)s %(message)s"
                )
            }
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
