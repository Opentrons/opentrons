"""A script for monitoring CAN bus."""
import asyncio
import dataclasses
import logging
import argparse
from datetime import datetime
from logging.config import dictConfig

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId,
)

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

log = logging.getLogger(__name__)


async def task(messenger: CanMessenger) -> None:
    """A task that listens for can messages.

    Args:
        messenger: Messenger

    Returns: Nothing.
    """
    label_style = "\033[0;37;40m"
    header_style = "\033[0;36;40m"
    data_style = "\033[1;36;40m"
    with WaitableCallback(messenger) as cb:
        async for message, arbitration_id in cb:
            try:
                msg_name = MessageId(arbitration_id.parts.message_id).name
                from_node = NodeId(arbitration_id.parts.originating_node_id).name
                to_node = NodeId(arbitration_id.parts.node_id).name
                arb_id_str = f"{data_style}{msg_name} ({from_node}->{to_node})"
            except ValueError:
                arb_id_str = f"{data_style}0x{arbitration_id.id:x}"
            print(f"{header_style}{datetime.now()} {arb_id_str}")
            for name, value in dataclasses.asdict(message.payload).items():
                print(f"\t{label_style}{name}: {data_style}{value}")


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver)
    messenger.start()

    loop = asyncio.get_event_loop()
    fut = loop.create_task(task(messenger))
    try:
        await fut
    except KeyboardInterrupt:
        fut.cancel()
    except asyncio.CancelledError:
        pass
    finally:
        await messenger.stop()
        driver.shutdown()


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
            "filename": "can_mon.log",
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

    parser = argparse.ArgumentParser(description="CAN bus monitoring.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
