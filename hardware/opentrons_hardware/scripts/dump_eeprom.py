#!/usr/bin/env python3
"""blow away and reset EEPROM file systems."""

import asyncio
import logging
import argparse
from logging.config import dictConfig
from typing import Dict, Any
from typing_extensions import Final

from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings import utils, ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
    payloads,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

logger = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}

TARGETS: Final[Dict[str, NodeId]] = {
    "head": NodeId.head,
    "gantry-x": NodeId.gantry_x,
    "gantry-y": NodeId.gantry_y,
    "pipette-left": NodeId.pipette_left,
    "pipette-right": NodeId.pipette_right,
    "gripper": NodeId.gripper,
}


async def run(args: argparse.Namespace) -> None:
    """Script entrypoint."""
    with open(args.file, "w") as f:

        def handle_read_resp(
            message: MessageDefinition, arbitration_id: ArbitrationId
        ) -> None:
            """Called by can messenger when a message arrives."""
            if isinstance(message, message_definitions.ReadFromEEPromResponse):
                f.write(
                    "".join("{:02x} ".format(x) for x in message.payload.data.value)
                )
                f.write("\n")

        async with build.driver(build_settings(args)) as driver, CanMessenger(
            driver
        ) as messenger:
            messenger.add_listener(
                handle_read_resp,
                lambda arbitration_id: bool(
                    arbitration_id.parts.message_id == MessageId.read_eeprom_response
                ),
            )

            await dump_eeprom(
                messenger,
                TARGETS[args.target],
                256 if args.old_version else 16384,
            )
            await asyncio.sleep(3)


async def dump_eeprom(messenger: CanMessenger, node: NodeId, limit: int) -> None:
    """Wipe out all of the data used for the general purpose file system."""
    start = 0
    max_read = 8
    while start < limit:
        read_len = min(max_read, limit - start)
        read_msg = message_definitions.ReadFromEEPromRequest(
            payload=payloads.EEPromReadPayload(
                address=utils.UInt16Field(start),
                data_length=utils.UInt16Field(read_len),
            )
        )
        start += read_len
        await messenger.send(node, read_msg)


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description=__doc__)

    add_can_args(parser)
    parser.add_argument(
        "--target",
        help="The FW subsystem to be cleared.",
        type=str,
        required=True,
        choices=TARGETS.keys(),
    )
    parser.add_argument(
        "--file",
        help="file where to save the dump file.",
        type=str,
        default="/var/log/eeprom_dump.hex",
        required=False,
    )
    parser.add_argument(
        "--less-logs",
        help="Set log level to INFO, so we see less logs.",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--old-version",
        help="Enable this flag to clear eeprom on the older 256 Byte eeproms.",
        action="store_true",
        default=False,
    )

    args = parser.parse_args()

    def _set_log_lvl_warn(d: Dict[str, Any]) -> None:
        for k in d.keys():
            if isinstance(d[k], dict):
                _set_log_lvl_warn(d[k])
            elif k == "level":
                d[k] = logging.WARNING

    if args.less_logs:
        _set_log_lvl_warn(LOG_CONFIG)
    dictConfig(LOG_CONFIG)
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
