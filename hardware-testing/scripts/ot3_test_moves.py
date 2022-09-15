"""OT3 Move Test."""
import argparse
import asyncio
from typing import Union, Type

from opentrons.config import robot_configs
from opentrons.config.types import GantryLoad
from opentrons.types import Point
from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.thread_manager import ThreadManager
from opentrons.hardware_control.api import API as OT2API
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis

from hardware_testing.opentrons_api.helpers import (
    stop_server_ot3,
    update_axis_motion_settings_ot3,
    update_axis_current_settings_ot3,
    home_ot3,
)

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE


def _get_input_ignoring_empty(msg: str) -> str:
    res = input(msg)
    if not res:
        return _get_input_ignoring_empty(msg)
    else:
        return res


async def _set_default_motion_settings(api: ThreadManager[HardwareControlAPI]) -> None:
    default_speeds = {
        OT3Axis.X: 1200,
        OT3Axis.Y: 1200,
        OT3Axis.Z_L: 500,
        OT3Axis.Z_R: 500,
    }
    default_accelerations = {
        OT3Axis.X: 2500,
        OT3Axis.Y: 2500,
        OT3Axis.Z_L: 1000,
        OT3Axis.Z_R: 1000,
    }
    default_discontinuity = 0
    for ax in default_speeds.keys():
        update_axis_motion_settings_ot3(
            api,
            axis=ax,
            default_max_speed=default_speeds[ax],
            acceleration=default_accelerations[ax],
            max_speed_discontinuity=default_discontinuity,
            direction_change_speed_discontinuity=default_discontinuity,
        )


async def _set_default_current_settings(api: ThreadManager[HardwareControlAPI]) -> None:
    max_motor_current = 1.5
    default_hold_current = 0.1
    for ax in [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]:
        update_axis_current_settings_ot3(
            api, ax, hold_current=default_hold_current, run_current=max_motor_current
        )


async def _main(api: ThreadManager[HardwareControlAPI]) -> None:
    await api.set_gantry_load(gantry_load=LOAD)
    await _set_default_motion_settings(api)
    await _set_default_current_settings(api)
    await home_ot3(api)
    safe_dist_from_home = 20
    step_x = 350
    step_y = 300
    await api.move_rel(mount=MOUNT, delta=Point(x=0, y=-safe_dist_from_home, z=0))
    await api.move_rel(mount=MOUNT, delta=Point(x=-safe_dist_from_home, y=0, z=0))
    await api.move_rel(mount=MOUNT, delta=Point(x=-step_x, y=0, z=0))
    await api.move_rel(mount=MOUNT, delta=Point(x=step_x, y=-step_y, z=0))
    await api.move_rel(mount=MOUNT, delta=Point(x=-step_x, y=0, z=0))
    await api.move_rel(mount=MOUNT, delta=Point(x=step_x, y=step_y, z=0))


if __name__ == "__main__":
    parser = argparse.ArgumentParser("OT3 Test Template")
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()

    HWApi: Union[Type[OT3API], Type[OT2API]] = OT3API
    config = robot_configs.load_ot3()
    if args.simulate:
        hw_api = ThreadManager(HWApi.build_hardware_simulator, config=config)
    else:
        stop_server_ot3()
        hw_api = ThreadManager(HWApi.build_hardware_controller, config=config)

    hw_api.managed_thread_ready_blocking()
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
