#!/usr/bin/env python3
"""Provisions pipette EEPROMs.

This can be used either on a production line or locally.

A log of what has been flashed to pipettes can be found at
provision_pipette.log.
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
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.instruments.pipettes import serials


async def run(
    args: argparse.Namespace, base_log: logging.Logger, trace_log: logging.Logger
) -> None:
    """Script entrypoint."""
    which_pipette = {"left": NodeId.pipette_left, "right": NodeId.pipette_right}[
        args.which
    ]
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:
        await flash_serials(messenger, which_pipette, base_log, trace_log)


async def flash_serials(
    messenger: CanMessenger,
    which_pipette: NodeId,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Flash serials in a loop."""
    while True:
        should_quit = await get_and_update_serial_once(
            messenger, which_pipette, base_log, trace_log
        )
        if should_quit:
            return


def _read_input_and_confirm(prompt: str) -> str:
    inp = input(prompt).strip()
    if "y" in input(f"read serial '{inp}', write to pipette? (y/n): "):
        return inp
    else:
        return _read_input_and_confirm(prompt)


async def get_serial(
    prompt: str, base_log: logging.Logger
) -> Tuple[PipetteName, int, bytes]:
    """Get a serial number that is correct and parseable."""
    loop = asyncio.get_running_loop()
    while True:
        serial = await loop.run_in_executor(
            None, lambda: _read_input_and_confirm(prompt)
        )
        try:
            name, model, data = serials.info_from_serial_string(serial)
        except Exception as e:
            base_log.exception("invalid serial")
            if isinstance(e, KeyboardInterrupt):
                raise
            print(str(e))
        else:
            base_log.info(
                f"parsed name {name} model {model} datecode {data!r} from {serial}"
            )
            return name, model, data


async def update_serial_and_confirm(
    messenger: CanMessenger,
    which_pipette: NodeId,
    name: PipetteName,
    model: int,
    data: bytes,
    base_log: logging.Logger,
    trace_log: logging.Logger,
    attempts: int = 3,
    attempt_timeout_s: float = 1.0,
) -> None:
    """Update and verify the update of serial data."""
    for attempt in range(attempts):
        serial_bytes = serials.serial_val_from_parts(name, model, data)
        base_log.debug(
            f"beginning set and confirm attempt {attempt} with bytes {serial_bytes!r}"
        )
        set_message = message_definitions.SetSerialNumber(
            payload=payloads.SerialNumberPayload(
                serial=fields.SerialField(serial_bytes)
            )
        )
        await messenger.send(which_pipette, set_message)

        base_log.debug(f"Sent set-serial: {set_message}")
        await messenger.send(which_pipette, message_definitions.InstrumentInfoRequest())
        target = datetime.datetime.now() + datetime.timedelta(seconds=attempt_timeout_s)
        try:
            while True:
                with WaitableCallback(messenger) as wc:
                    message, arb = await asyncio.wait_for(
                        wc.read(), (target - datetime.datetime.now()).total_seconds()
                    )
                    if (
                        isinstance(message, message_definitions.PipetteInfoResponse)
                        and arb.parts.originating_node_id == which_pipette
                    ):
                        if (
                            message.payload.name == fields.PipetteNameField(name.value)
                            and message.payload.model == UInt16Field(model)
                            and message.payload.serial == fields.SerialField(data)
                        ):
                            base_log.info(f"serial confirmed on attempt {attempt}")
                            return
                        else:
                            raise RuntimeError(
                                f"serial does not match expected "
                                f"(name={message.payload.name}, "
                                f"model={message.payload.model}, "
                                f"serial={message.payload.serial})"
                            )
                    base_log.debug(f"message {type(message)} is not relevant")
                    base_log.debug(
                        f"{(target-datetime.datetime.now()).total_seconds()} remaining in attempt {attempt}"
                    )
        except asyncio.TimeoutError:
            continue


async def get_and_update_serial_once(
    messenger: CanMessenger,
    which_pipette: NodeId,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Read and update a single serial."""
    name, model, data = await get_serial(
        f'Enter serial for pipette on {which_pipette.name.split("_")[-1]}: ', base_log
    )
    try:
        await update_serial_and_confirm(
            messenger, which_pipette, name, model, data, base_log, trace_log
        )
        trace_log.info(f"SUCCESS,{name.name},{model},{data!r}")
    except Exception:
        base_log.exception("Update failed")
        trace_log.info(f"FAILURE,{name.name},{model},{data!r}")
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
                    "filename": "/var/log/provision_pipette_debug.log",
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
                    "filename": "/var/log/provision_pipette.log",
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
            "provision_pipettes_debug.log"
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
    parser.add_argument(
        "-w",
        "--which",
        type=str,
        choices=["left", "right"],
        help="Which pipette to flash",
    )
    add_can_args(parser)

    args = parser.parse_args()
    base_log, trace_log = log_config(getattr(logging, args.log_level))
    asyncio.run(run(args, base_log, trace_log))


if __name__ == "__main__":
    main()
