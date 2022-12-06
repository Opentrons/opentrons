"""Test Jogging."""
import argparse
import asyncio
import termios
import sys,tty,time
import datetime

from typing import List, Optional, Dict, Tuple
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)
from opentrons.config.types import GantryLoad, PerPipetteAxisSettings
from opentrons.hardware_control.types import OT3Mount, OT3Axis, Axis, CriticalPoint
from opentrons.types import Mount


CUSTOM_AXIS_SETTINGS = {
    types.OT3Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    )
}

DEFAULT_AXIS_SETTINGS = {
    types.OT3Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    )
}

async def _stage_check(api: OT3API,mount: OT3Mount,critical_point: Optional[CriticalPoint] = None) -> None:
    pos_diff = 5
    z_axis = OT3Axis.by_mount(mount)
    pos = await api.current_position_ot3(mount=mount)
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   320))
    motors_pos_d = await api.current_position_ot3(mount=mount)
    enc_pos_d = await api.encoder_current_position(mount=mount)
    mx_d, my_d, mz_d = [
        round(motors_pos_d[ax], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    ex_d, ey_d, ez_d = [
        round(enc_pos_d[ax.to_axis()], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    print(f"Deck Coordinate_down: X={mx_d}, Y={my_d}, Z={mz_d}")
    print(f"Enc. Coordinate_down: X={ex_d}, Y={ey_d}, Z={ez_d}")
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   480))
    motors_pos_u = await api.current_position_ot3(mount=mount)
    enc_pos_u = await api.encoder_current_position(mount=mount)
    mx_u, my_u, mz_u = [
        round(motors_pos_u[ax], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    ex_u, ey_u, ez_u = [
        round(enc_pos_u[ax.to_axis()], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    print(f"Deck Coordinate_up: X={mx_u}, Y={my_u}, Z={mz_u}")
    print(f"Enc. Coordinate_up: X={ex_u}, Y={ey_u}, Z={ez_u}")

    # if abs(enc_diff) >= pos_diff:
    #     return 'No skipped steps'
    # else:
    #     return 'Has skipped steps'
    return 'Pass'


async def _zstage(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home_z()
    currents = (0.2, 0.5, 1.0, 1.5)
    speeds = (50, 100)
    speed_force_gauge = (2, 5, 10, 20)
    results = []
    # Do left mount step check
    print('Start left mount stage check:')
    global CUSTOM_AXIS_SETTINGS
    global DEFAULT_AXIS_SETTINGS
    for cu in currents:
        for sp in speeds:
            print('  Current: {}, Speed: {}::::'.format(cu, sp))
            input('Pause')
            userSetting = helpers_ot3.GantryLoadSettings(
                    max_speed=float(sp),
                    acceleration=200,
                    max_start_stop_speed=1,
                    max_change_dir_speed=1,
                    hold_current=0.1,
                    run_current=float(cu))
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_L: userSetting})
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_R: userSetting})
            # print(CUSTOM_AXIS_SETTINGS)
            await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, CUSTOM_AXIS_SETTINGS)
            res = await _stage_check(api, types.OT3Mount.LEFT)
            time.sleep(0.2)
            await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, DEFAULT_AXIS_SETTINGS)
            time.sleep(0.1)
            await api.home_z()
            # print('  Current: {}, Speed: {},  Result: {}'.format(cu,sp,res))
        # # Do right mount step check
        # # Do force gauge
        # print('Start force gauge record:')




if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_zstage(args.simulate))
