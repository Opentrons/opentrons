"""OT-3 Auto Calibration."""
from hardware_testing.opentrons_api.types import OT3Mount, GripperProbe, Point
from hardware_testing.opentrons_api import helpers_ot3

import os
import sys
import asyncio
import argparse
import csv
import logging
from logging.config import dictConfig

from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    calibrate_gripper_jaw,
    calibrate_gripper,
)
from opentrons.hardware_control.ot3api import OT3API

os.environ["OT_API_FF_enableOT3HardwareController"] = "true"

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
            "filename": "/var/log/auto_calibration.log",
            "maxBytes": 5000000,
            "level": logging.INFO,
            "backupCount": 3,
        },
        "stream_handler": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "basic",
            "level": logging.INFO,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.INFO,
            "propagate": True,
        },
    },
}


async def fast_home_seq(api: OT3API, mount: OT3Mount, fast_home_pos: Point) -> None:
    """Fast home."""
    # home z first
    cur_pos = await api.gantry_position(mount, refresh=True)
    await api.move_to(mount, cur_pos._replace(z=fast_home_pos.z))
    await api.move_to(mount, fast_home_pos)


async def _main(
    simulate: bool, slot: int, mount: OT3Mount, cycle: int, id: str
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV102",
        use_defaults=True,
    )
    await api.home()
    homed_pos = await api.gantry_position(mount)
    fast_home_pos = homed_pos + Point(-5, -5, -5)
    try:
        for i in range(cycle):
            if mount == OT3Mount.GRIPPER:
                if id != "S1":
                    offset = await calibrate_gripper_jaw(api, GripperProbe.FRONT, slot)
                    if id == "all":
                        front_offset = offset
                        await api.home_z()
                        input("Add probe to gripper REAR, then press ENTER: ")

                if id != "S0":
                    offset = await calibrate_gripper_jaw(api, GripperProbe.REAR, slot)
                    if id == "all":
                        rear_offset = offset
                        offset = await calibrate_gripper(api, front_offset, rear_offset)
                        await api.home_z()
                        input("Add probe to gripper FRONT, then press ENTER: ")
            else:
                assert mount is not OT3Mount.GRIPPER
                offset = await calibrate_pipette(api, mount, slot)

            with open(f"/var/{mount}_{id}_auto_cal.csv", "a") as cv:
                writer = csv.writer(cv)
                writer.writerow(offset)

            await fast_home_seq(api, mount, fast_home_pos)
            await api.home()
    finally:
        cur_pos = await api.gantry_position(mount)
        if cur_pos != homed_pos:
            await fast_home_seq(api, mount, fast_home_pos)
            await api.home()


if __name__ == "__main__":
    dictConfig(LOG_CONFIG)
    print("\nOT-3 Auto-Calibration\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Auto-Calibration")
    arg_parser.add_argument(
        "--mount", "-m", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--slot", type=int, default=5)
    arg_parser.add_argument("--cycle", type=int, default=50)
    arg_parser.add_argument("--id", "-i", choices=["S0", "S1", "all"], default="all")
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    asyncio.run(_main(args.simulate, args.slot, _mount, args.cycle, args.id))
