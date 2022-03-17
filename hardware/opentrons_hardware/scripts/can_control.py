#!/usr/bin/env python3
"""Fused read and write for canbus messages.

Uses the styled output of can_mon while allowing message prompts as can_comm.

Enter ? to get the can_comm prompts.
"""
import asyncio
import logging
import argparse
from logging.config import dictConfig
from typing import TextIO, Optional

from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.message import CanMessage

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from .can_mon import task as monitor_task
from .can_comm import prompt_message, InvalidInput

async def get_input(
        input_file: TextIO,
        output_file: TextIO,
        output_lock: asyncio.Lock,
        brief_prompt: bool = True
) -> Optional[CanMessage]:
    def prompt_with_io(promptstr: str) -> str:
        output_file.write(promptstr)
        output_file.flush()
        userinput = input_file.readline()
        if userinput.lower().strip() in ['exit', 'quit']:
            raise SystemExit()
        return userinput

    def write_with_newline(outstr: str) -> None:
        output_file.write(outstr + "\n")
        output_file.flush()

    try:
        async with output_lock:
            return await asyncio.get_event_loop().run_in_executor(
                None, prompt_message, prompt_with_io, write_with_newline, brief_prompt
            )
    except InvalidInput as e:
        write_with_newline(str(e))
    return None


async def input_task(
    can_driver: AbstractCanDriver,
    input_file: TextIO,
    output_file: TextIO,
    output_lock: asyncio.Lock,
) -> None:
    """UI task to create and send messages.

    Args:
        can_driver: Can driver
        input_file: IO buf to read from
        output_file: IO buf to write to
        output_lock: Async lock for exclusive writes
    """

    can_message = await get_input(input_file, output_file, output_lock, False)
    if can_message:
        await can_driver.send(can_message)
    while True:
        can_message = await get_input(input_file, output_file, output_lock)
        if can_message:
            await can_driver.send(can_message)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))

    messenger = CanMessenger(driver)
    messenger.start()
    write_lock = asyncio.Lock()

    try:
        all_fut = asyncio.gather(
                monitor_task(messenger, args.output, write_lock),
                input_task(driver, args.input, args.output, write_lock),
            )
        await all_fut
    except KeyboardInterrupt:
        all_fut.cancel()
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

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        help="Where to write monitored canbus output to",
        type=argparse.FileType("w"),
        default="-",
    )
    parser.add_argument(
        "-i",
        "--input",
        help="Where to listen for canbus input",
        type=argparse.FileType("r"),
        default="-",
    )
    add_can_args(parser)

    args = parser.parse_args()

    try:
        asyncio.run(run(args))
    except KeyboardInterrupt:
        args.output.write('Quitting...\n')
        args.output.flush()


if __name__ == "__main__":
    main()
