"""Pipette Temperature Rise Test OT3."""
import argparse
import asyncio
from time import sleep

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.errors import MustHomeError

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    move_to_arched_ot3,
    get_slot_calibration_square_position_ot3
)

import logging
LOG = logging.getLogger(__name__)
LOG.setLevel(logging.INFO)

AXIS_MAP = {
    "Y": Axis.Y,
    "X": Axis.X,
    "Z": Axis.Z
}
GANTRY_LOAD_MAP = {"LOW": GantryLoad.LOW_THROUGHPUT,
                   "HIGH": GantryLoad.HIGH_THROUGHPUT}

SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=350,
        acceleration=800,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.25,
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=300,
        acceleration=600,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.2,
    ),
    Axis.Z: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.5,
        run_current=1.5,
    )
}

async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_96_v3.4"
    )
    # api.reset()
    await api.home()
    await set_gantry_load_per_axis_settings_ot3(
        api, SETTINGS, load=GANTRY_LOAD_MAP["HIGH"]
    )

    await api._backend.set_hold_current(Axis.Z_R, 0.1)

    mount = OT3Mount.LEFT
    while True:
        celsius, humidity = await helpers_ot3.get_temperature_humidity_ot3(
            api, mount)
        LOG.info(celsius)
        sleep(5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
