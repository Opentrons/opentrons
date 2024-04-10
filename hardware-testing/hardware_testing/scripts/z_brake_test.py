"""Test to determine if Z moves while brake is endgaged/disengaged."""
import argparse
import asyncio
import csv
import numpy as np
import time
import os
from typing import Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API
from opentrons_shared_data.errors.exceptions import PositionUnknownError

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
)

from opentrons_hardware.firmware_bindings.constants import NodeId


LOAD = GantryLoad.LOW_THROUGHPUT


SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1,
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1,
    ),
    Axis.Z_L: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=1,
    ),
    Axis.Z_R: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=1,
    ),
    Axis.Z_G: GantryLoadSettings(
        max_speed=50,
        acceleration=150,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.2,
        run_current=0.67,
    )
}

step_x = 500
step_y = 300
xy_home_offset = 7
step_z = -100
step_g = 150
HOME_POINT_MAP = {
    "Y": Point(y=-xy_home_offset),
    "X": Point(x=-xy_home_offset),
    "L": Point(z=0),
    "R": Point(z=0),
    "G": Point(z=0)
}

POINT_MAP = {
    "Y": Point(y=step_y),
    "X": Point(x=step_x),
    "L": Point(z=step_z),
    "R": Point(z=step_z),
    "G": Point(z=step_g)
}


async def match_z_settings(
    axis: str, current: float
) -> bool:
    """Ensure L and R don't overwrite eachother."""
    if axis == "L" or axis == "R":
        SETTINGS[AXIS_MAP["L"]].hold_current = current
        SETTINGS[AXIS_MAP["R"]].hold_current = current

    return True

async def _main(is_simulating: bool) -> None:
    """Main run function."""
    print("Building API")
    api = await build_async_ot3_hardware_api(
        is_simulating=is_simulating, stall_detection_enable=False
    )

    try:
        await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await api.move_rel(mount=OT3Mount.RIGHT, delta=POINT_MAP["R"], speed=100)

        for i in range(50):
            # Output encoder
            l_pos_i = await api.encoder_current_position_ot3(mount=OT3Mount.LEFT,
                                                              refresh=True)
            r_pos_i = await api.encoder_current_position_ot3(mount=OT3Mount.RIGHT,
                                                              refresh=True)


            # Engage brake
            await api.disengage_axes([Axis.Z_L, Axis.Z_R])

            # Output encoder
            l_pos_f = await api.encoder_current_position_ot3(mount=OT3Mount.LEFT,
                                                              refresh=True)
            r_pos_f = await api.encoder_current_position_ot3(mount=OT3Mount.RIGHT,
                                                              refresh=True)

            print("LEFT: " + str(l_pos_f[Axis.Z_L]-l_pos_i[Axis.Z_L]))
            print("RIGHT: " + str(r_pos_f[Axis.Z_R]-r_pos_i[Axis.Z_R]))

            # Engage Motor
            await api.engage_axes([Axis.Z_L, Axis.Z_R])

            # Output encoder
            l_pos = await api.encoder_current_position_ot3(mount=OT3Mount.LEFT,
                                                              refresh=True)
            r_pos = await api.encoder_current_position_ot3(mount=OT3Mount.RIGHT,
                                                              refresh=True)


            # await set_gantry_load_per_axis_settings_ot3(
            #     api, SETTINGS, load=LOAD
            # )
    except KeyboardInterrupt:
        await api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    finally:
        # await api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")

    args = parser.parse_args()

    asyncio.run(_main(args.simulate))
