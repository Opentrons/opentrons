#!/usr/bin/env python3
"""Provisions hepauv EEPROMs.

This can be used either on a production line or locally.

A log of what has been flashed to the hepauv
/var/log/provision_hepauv.log
"""

import re
import asyncio
import logging
import logging.config
import argparse
import struct
from typing import Any, Tuple, Dict, Optional

from opentrons_hardware.instruments.serial_utils import ensure_serial_length
from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.utils import UInt16Field
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
    payloads,
    fields,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, MessageId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


log = logging.getLogger(__name__)


INFO_REGEX_STRING = (
    "^"  # start of string
    "HUV"  # The characters HUV
    r"(?P<model>\d{2})"  # "model" group contains exactly 2 digits
    r"(?P<code>[\w\d]{0,12})"  # "code" group contains 0 to 12 inclusive alphanumeric characters
    "$"  # end of string
)

SERIAL_RE = re.compile(INFO_REGEX_STRING)


async def get_serial(prompt: str) -> Tuple[int, bytes]:
    """Get a serial number that is correct and parseable."""
    while True:
        serial = input(prompt).strip()

        # Match the string
        matches = SERIAL_RE.match(serial.strip())
        if matches:
            model = int(matches.group("model"))
            data = ensure_serial_length(matches.group("code").encode("ascii"))
            if not serial or "y" not in input(
                f"read serial '{serial}', write to hepauv? (y/n): "
            ):
                continue
            log.info(f"parsed model {model} datecode {data!r} from {serial}")
            return model, data
        raise RuntimeError(f"Invalid serial number: {serial}")


async def update_serial_and_confirm(
    messenger: CanMessenger,
    model: int,
    data: bytes,
    attempts: int = 3,
) -> bool:
    """Update and verify the update of serial data."""
    hepauv_info: Optional[md.HepaUVInfoResponse] = None
    event = asyncio.Event()

    def _listener(message: MessageDefinition, _: ArbitrationId) -> None:
        nonlocal hepauv_info
        if isinstance(message, md.HepaUVInfoResponse):
            hepauv_info = message
            event.set()

    def _filter(arb_id: ArbitrationId) -> bool:
        return (NodeId(arb_id.parts.originating_node_id) == NodeId.hepa_uv) and (
            MessageId(arb_id.parts.message_id) == MessageId.hepauv_info_response
        )

    messenger.add_listener(_listener, _filter)

    serial_bytes = struct.pack(">H16s", model, ensure_serial_length(data))
    set_message = md.SetSerialNumber(
        payload=payloads.SerialNumberPayload(serial=fields.SerialField(serial_bytes))
    )
    for attempt in range(attempts):
        log.debug(
            f"beginning set and confirm attempt {attempt} with bytes {serial_bytes!r}"
        )
        await messenger.send(NodeId.hepa_uv, set_message)
        log.debug(f"Sent set-serial: {set_message}")

        # wait some time before confirming
        await asyncio.sleep(1)

        # confirm that we set the proper serial number
        log.info("Confirming serial number")
        await messenger.send(node_id=NodeId.hepa_uv, message=md.InstrumentInfoRequest())
        try:
            await asyncio.wait_for(event.wait(), 1.0)
            if (
                hepauv_info
                and hepauv_info.payload.model == UInt16Field(model)
                and hepauv_info.payload.serial == fields.SerialField(data)
            ):
                log.info(f"serial confirmed on attempt {attempt}")
                messenger.remove_listener(_listener)
                return True
        except asyncio.TimeoutError:
            log.warning("Instrument info request timed out")

    messenger.remove_listener(_listener)
    log.error(f"Could not get HepaInfoResponse after {attempts} retries.")
    return False


async def _main(args: argparse.Namespace) -> None:
    """Script entrypoint."""
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:
        while True:
            try:
                model, data = await get_serial("Enter serial for hepauv: ")
                success = await update_serial_and_confirm(messenger, model, data)
            except KeyboardInterrupt:
                log.warning("Keyboard Interrupt!")
                break
            except RuntimeError as e:
                log.error(e)
                continue

            # print result
            log.info(f"SUCCESS,{model},{data!r}") if success else log.error(
                f"FAILURE,{model},{data!r}"
            )

            # breakout if we only want to program once
            if args.once:
                break


def log_config(log_level: int) -> Dict[str, Any]:
    """Configure logging."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
        },
        "handlers": {
            "stream_handler": {
                "class": "logging.StreamHandler",
                "formatter": "basic",
                "level": log_level,
            },
            "file_handler": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "basic",
                "filename": "/var/log/provision_hepauv.log",
                "maxBytes": 5000000,
                "level": log_level,
                "backupCount": 3,
            },
        },
        "loggers": {
            "": {
                "handlers": ["stream_handler"]
                if log_level > logging.INFO
                else ["stream_handler", "file_handler"],
                "level": log_level,
            },
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-l",
        "--log-level",
        help=(
            "Developer logging level. At DEBUG or below, logs are written "
            "to console; at INFO or above, logs are only written to "
            "provision_hepauv.log"
        ),
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run just once and quit instead of staying in a loop",
    )
    add_can_args(parser)

    args = parser.parse_args()
    logging.config.dictConfig(log_config(getattr(logging, args.log_level)))
    try:
        asyncio.run(_main(args))
    except Exception as e:
        log.exception(f"Unexpected exception: {e}")
    finally:
        log.info("Exiting...")
