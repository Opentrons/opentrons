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
from opentrons.hardware_control.types import OT3Mount, OT3Axis, Axis
from opentrons.types import Mount



leftrear_pos = {
    'X':200,
    'Y':480,
    'Z':500
}
rightrear_pos = {
    'X':480,
    'Y':480,
    'Z':500
}
leftfront_pos = {
    'X':200,
    'Y':200,
    'Z':500
}
rightfront_pos = {
    'X':480,
    'Y':200,
    'Z':500,
}
center_pos = {
    'X':300,
    'Y':300,
    'Z':320
}

async def _stepscheck() -> None:
    pass
async def _overnight(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    # Home gantry
    await api.home()
    condition = True
    starttime = datetime.datetime.now()
    mount_left = OT3Mount.LEFT
    mount_right = OT3Mount.RIGHT
    current_pos = await api.current_position_ot3(mount=mount_left)
    current_pos_r = await api.current_position_ot3(mount=mount_right)
    count = 0
    while condition:
        try:
            count += 1
            endtime = datetime.datetime.now()
            deltatime = (endtime - starttime).seconds
            if int(deltatime)/3600 >= 24:
                condition = False

            # Move round
            await api.move_to(mount_left, Point(rightrear_pos['X'],
                                           rightrear_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(leftrear_pos['X'],
                                           leftrear_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(leftfront_pos['X'],
                                           leftfront_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(rightfront_pos['X'],
                                           rightfront_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))

            # Move X

            await api.move_to(mount_left, Point(rightrear_pos['X'],
                                           rightrear_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(leftfront_pos['X'],
                                           leftfront_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(rightfront_pos['X'],
                                           rightfront_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(leftrear_pos['X'],
                                           leftrear_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))
            await api.move_to(mount_left, Point(rightrear_pos['X'],
                                           rightrear_pos['Y'],
                                           current_pos[OT3Axis.by_mount(mount_left)]))

            # Move Z for 2 times

            for i in range(2):
                # move left mount
                await api.move_to(mount_left, Point(center_pos['X'],
                                               center_pos['Y'],
                                               center_pos['Z']))

                await api.move_to(mount_left, Point(center_pos['X'],
                                               center_pos['Y'],
                                               current_pos[OT3Axis.by_mount(mount_left)]))

                # move right mount
                await api.move_to(mount_right, Point(center_pos['X'],
                                               center_pos['Y'],
                                               center_pos['Z']))

                await api.move_to(mount_right, Point(center_pos['X'],
                                               center_pos['Y'],
                                               current_pos_r[OT3Axis.by_mount(mount_right)]))

            if count % 10 == 0:
                # Check skipped steps
                _stepscheck()
                await api.home()

        except Exception as e:
            print(e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_overnight(args.simulate))
