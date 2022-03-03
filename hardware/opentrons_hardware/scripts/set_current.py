"""A very simple script to set motor currents."""
import os
import argparse
import asyncio
import json
import logging
from logging.config import dictConfig
from typing import Optional

from opentrons_hardware.drivers.can_bus import CanDriver
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


log = logging.getLogger(__name__)

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


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()

    currents = {NodeId.gantry_y: 0.8}

    with open(args.params_file_path, "r") as f:
        current_params = json.load(f)

    currents = {NodeId[k]: tuple(v) for k, v in current_params.items()}

    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        pass
    finally:
        await messenger.stop()
        driver.shutdown()


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus set currents.")
    
    add_can_args(parser)
    
    parser.add_argument(
        "--params-file-path",
        "-p",
        type=str,
        required=False,
        default=os.path.join(os.path.dirname(__file__) + "/currents_config.json"),
        help="the parameter file path",
    )

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
