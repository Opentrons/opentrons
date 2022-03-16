"""A script for monitoring CAN bus."""
import asyncio
import dataclasses
import logging
import argparse
import atexit
import sys
from datetime import datetime
from logging.config import dictConfig
from typing import List, Optional, TextIO


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


@dataclasses.dataclass
class StyledOutput:
    """Dataclass bundling style and content for terminal output."""

    style: str
    content: str


class Writer:
    """Class that knows where to write and how to safely style output."""

    RESET_STYLE = "\033[0m"

    def __init__(self, destination: TextIO) -> None:
        """Build a writer with a destination.

        Args:
            destination: A TextIO to write to. If this is a canonical output
                         fd (e.g. stdout, stderr) styled output will be used;
                         otherwise (for instance, if destination is a pipe)
                         there will be no output styling.
        """
        self._dest = destination
        self._do_style = self._dest in (sys.stdout, sys.stderr)
        if self._do_style:
            atexit.register(self._reset_shell_style)

    def write(self, output: List[StyledOutput]) -> None:
        """Write styled output to the destination.

        Elements are joined with spaces and the styling is reset after all prints.
        """
        for elem in output:
            if self._do_style:
                self._dest.write(elem.style)
            self._dest.write(elem.content)
            if self._do_style:
                self._dest.write(self.RESET_STYLE)
            self._dest.write(" ")

    def _reset_shell_style(self) -> None:
        self._dest.write(self.RESET_STYLE)


async def task(
    messenger: CanMessenger,
    write_to: TextIO,
    write_lock: Optional[asyncio.Lock] = None,
) -> None:
    """A task that listens for can messages.

    Args:
        messenger: Messenger
        write_to: Destination to write to
        write_lock: Optionally, a lock for exclusive writes.

    Returns: Nothing.
    """
    writer = Writer(write_to)
    label_style = "\033[0;37;40m"
    header_style = "\033[0;36;40m"
    data_style = "\033[1;36;40m"

    checked_write_lock = write_lock or asyncio.Lock()

    with WaitableCallback(messenger) as cb:
        async for message, arbitration_id in cb:
            try:
                msg_name = MessageId(arbitration_id.parts.message_id).name
                from_node = NodeId(arbitration_id.parts.originating_node_id).name
                to_node = NodeId(arbitration_id.parts.node_id).name
                arb_id_str = f"{msg_name} ({from_node}->{to_node})"
            except ValueError:
                arb_id_str = f"0x{arbitration_id.id:x}"
            async with checked_write_lock:
                writer.write(
                    [
                        StyledOutput(style=header_style, content=str(datetime.now())),
                        StyledOutput(style=data_style, content=arb_id_str + "\n"),
                    ]
                )
                for name, value in dataclasses.asdict(message.payload).items():
                    writer.write(
                        [
                            StyledOutput(style=label_style, content=f"\t{name}:"),
                            StyledOutput(style=data_style, content=str(value)),
                        ]
                    )


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver)
    messenger.start()

    loop = asyncio.get_event_loop()
    fut = loop.create_task(task(messenger, args.output))
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
            "level": logging.WARNING,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.WARNING,
        },
    },
}


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus monitoring.")
    parser.add_argument(
        "-o",
        "--output",
        help="Where to write monitored canbus output to",
        type=argparse.FileType("w"),
        default="-",
    )
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
