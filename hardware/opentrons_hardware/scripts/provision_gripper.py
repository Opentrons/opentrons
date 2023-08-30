#!/usr/bin/env python3
"""Provisions gripper EEPROMs.

This can be used either on a production line or locally.

A log of what has been flashed to pipettes can be found at
provision_gripper.log.
"""

import asyncio
import logging
import logging.config
import argparse
import datetime
from typing import Tuple

from opentrons_hardware.drivers.can_bus import build, CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.utils import UInt16Field
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.instruments.gripper import serials


async def run(
    args: argparse.Namespace, base_log: logging.Logger, trace_log: logging.Logger
) -> None:
    """Script entrypoint."""
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:
        await flash_serials(messenger, base_log, trace_log)


async def flash_serials(
    messenger: CanMessenger,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Flash serials in a loop."""
    while True:
        should_quit = await get_and_update_serial_once(messenger, base_log, trace_log)
        if should_quit:
            return


def _read_input_and_confirm(prompt: str) -> str:
    inp = input(prompt).strip()
    if "y" in input(f"read serial '{inp}', write to gripper? (y/n): "):
        return inp
    else:
        return _read_input_and_confirm(prompt)


async def get_serial(prompt: str, base_log: logging.Logger) -> Tuple[int, bytes]:
    """Get a serial number that is correct and parseable."""
    loop = asyncio.get_running_loop()
    while True:
        serial = await loop.run_in_executor(
            None, lambda: _read_input_and_confirm(prompt)
        )
        try:
            model, data = serials.gripper_info_from_serial_string(serial)
        except Exception as e:
            base_log.exception("invalid serial")
            if isinstance(Exception, KeyboardInterrupt):
                raise
            print(str(e))
        else:
            base_log.info(f"parsed model {model} datecode {data!r} from {serial}")
            return model, data


async def update_serial_and_confirm(
    messenger: CanMessenger,
    model: int,
    data: bytes,
    base_log: logging.Logger,
    trace_log: logging.Logger,
    attempts: int = 3,
    attempt_timeout_s: float = 1.0,
) -> None:
    """Update and verify the update of serial data."""
    for attempt in range(attempts):
        serial_bytes = serials.gripper_serial_val_from_parts(model, data)
        base_log.debug(
            f"beginning set and confirm attempt {attempt} with bytes {serial_bytes!r}"
        )
        set_message = message_definitions.SetSerialNumber(
            payload=payloads.SerialNumberPayload(
                serial=fields.SerialField(serial_bytes)
            )
        )
        await messenger.send(NodeId.gripper, set_message)

        base_log.debug(f"Sent set-serial: {set_message}")
        await messenger.send(
            NodeId.gripper, message_definitions.InstrumentInfoRequest()
        )
        target = datetime.datetime.now() + datetime.timedelta(seconds=attempt_timeout_s)
        try:
            while True:
                with WaitableCallback(messenger) as wc:
                    message, arb = await asyncio.wait_for(
                        wc.read(), (target - datetime.datetime.now()).total_seconds()
                    )
                    if (
                        isinstance(message, message_definitions.GripperInfoResponse)
                        and arb.parts.originating_node_id == NodeId.gripper
                    ):
                        if message.payload.model == UInt16Field(
                            model
                        ) and message.payload.serial == fields.SerialField(data):
                            base_log.info(f"serial confirmed on attempt {attempt}")
                            return
                        else:
                            base_log.debug("message relevant serial NOT confirmed")
                    base_log.debug(f"message {type(message)} is not relevant")
                    base_log.debug(
                        f"{(target-datetime.datetime.now()).total_seconds()} remaining in attempt {attempt}"
                    )
        except asyncio.TimeoutError:
            continue


async def get_and_update_serial_once(
    messenger: CanMessenger,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Read and update a single serial."""
    model, data = await get_serial("Enter serial for gripper: ", base_log)
    try:
        await update_serial_and_confirm(messenger, model, data, base_log, trace_log)
        trace_log.info(f"SUCCESS,{model},{data!r}")
    except Exception:
        base_log.exception("Update failed")
        trace_log.info(f"FAILURE,{model},{data!r}")
        raise


def log_config(log_level: int) -> Tuple[logging.Logger, logging.Logger]:
    """Configure logging."""
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": True,
            "formatters": {
                "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"},
                "production_trace": {"format": "%(asctime)s %(message)s"},
            },
            "handlers": {
                "main_log_handler": {
                    "class": "logging.handlers.RotatingFileHandler",
                    "formatter": "basic",
                    "filename": "/var/log/provision_gripper_debug.log",
                    "maxBytes": 5000000,
                    "level": log_level,
                    "backupCount": 3,
                },
                "stream_handler": {
                    "class": "logging.StreamHandler",
                    "formatter": "basic",
                    "level": log_level,
                },
                "trace_log_handler": {
                    "class": "logging.handlers.RotatingFileHandler",
                    "formatter": "basic",
                    "filename": "/var/log/provision_gripper.log",
                    "maxBytes": 5000000,
                    "level": logging.INFO,
                    "backupCount": 3,
                },
            },
            "loggers": {
                "": {
                    "handlers": (
                        ["main_log_handler"]
                        if log_level > logging.INFO
                        else ["main_log_handler", "stream_handler"]
                    ),
                    "level": log_level,
                },
                "trace_log": {
                    "handlers": ["trace_log_handler"],
                    "level": logging.INFO,
                },
            },
        }
    )
    return logging.getLogger(__name__), logging.getLogger("trace_log")


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-l",
        "--log-level",
        help=(
            "Developer logging level. At DEBUG or below, logs are written "
            "to console; at INFO or above, logs are only written to "
            "provision_gripper_debug.log"
        ),
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="WARNING",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run just once and quit instead of staying in a loop",
    )
    add_can_args(parser)

    args = parser.parse_args()
    base_log, trace_log = log_config(getattr(logging, args.log_level))
    asyncio.run(run(args, base_log, trace_log))


if __name__ == "__main__":
    main()
