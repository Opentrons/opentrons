#!/usr/bin/env python3
"""blow away and reset EEPROM file systems."""

import asyncio
import logging
import argparse
from logging.config import dictConfig
from typing import Dict, Any
from typing_extensions import Final

from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
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
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:

        await clear_eeprom(
            messenger, TARGETS[args.target], 256 if args.old_verison else 16384,
            "FFFFFFFFFFFFFFFF" if args.old_verison else "0000000000000000"
        )


async def clear_eeprom(messenger: CanMessenger, node: NodeId, limit: int, filler: str) -> None:
    """Wipe out all of the data used for the general purpose file system."""
    start = 30
    max_write = 8
    while start < limit:
        write_msg = message_definitions.WriteToEEPromRequest(
            payload=payloads.EEPromDataPayload(
                address=utils.UInt16Field(start),
                data_length=utils.UInt16Field(min(max_write, limit - start)),
                data=fields.EepromDataField.from_string(filler),
            )
        )
        await messenger.ensure_send(node, write_msg)


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        help="The FW subsystem to be cleared.",
        type=str,
        required=True,
        choices=TARGETS.keys(),
    )
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
        "--old-version",
        help=("enable this flag to clear eeprom on the older 256 Byte eeproms"),
        action="store_true",
        default=False,
    )
    add_can_args(parser)

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
