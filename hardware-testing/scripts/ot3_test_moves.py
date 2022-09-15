import argparse
import asyncio
from subprocess import run
from typing import Union, Type, Optional, List

from opentrons.config import robot_configs
from opentrons.config.types import OT3AxisKind, GantryLoad, PerPipetteAxisSettings
from opentrons.types import Point
from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.thread_manager import ThreadManager
from opentrons.hardware_control.api import API as OT2API
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis, CriticalPoint

MOUNT = OT3Mount.LEFT
CRIT_PNT = CriticalPoint.MOUNT
LOAD = GantryLoad.NONE


def stop_server() -> None:
    run(["systemctl", "stop", "opentrons-robot-server"])


def get_input_ignoring_empty(msg):
    res = input(msg)
    if not res:
        return get_input_ignoring_empty(msg)
    else:
        return res


async def get_current_position(api: ThreadManager[HardwareControlAPI]) -> Point:
    return await api.current_position_ot3(
        mount=MOUNT, critical_point=CRIT_PNT, refresh=True
    )


def _set_per_axis_setting(
    settings: PerPipetteAxisSettings, axis_kind: OT3AxisKind, value: float
) -> None:
    if LOAD == GantryLoad.HIGH_THROUGHPUT:
        settings.high_throughput[axis_kind] = value
    elif LOAD == GantryLoad.LOW_THROUGHPUT:
        settings.low_throughput[axis_kind] = value
    elif LOAD == GantryLoad.TWO_LOW_THROUGHPUT:
        settings.two_low_throughput[axis_kind] = value
    elif LOAD == GantryLoad.NONE:
        settings.none[axis_kind] = value
    elif LOAD == GantryLoad.GRIPPER:
        settings.gripper[axis_kind] = value


def update_axis_current_settings(
    api: ThreadManager[HardwareControlAPI],
    axis: OT3Axis,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> None:
    axis_kind = OT3Axis.to_kind(axis)
    if hold_current is not None:
        _set_per_axis_setting(
            api.config.current_settings.hold_current, axis_kind, hold_current
        )
    if run_current is not None:
        _set_per_axis_setting(
            api.config.current_settings.run_current, axis_kind, run_current
        )


def update_axis_motion_settings(
    api: ThreadManager[HardwareControlAPI],
    axis: OT3Axis,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> None:
    axis_kind = OT3Axis.to_kind(axis)
    if default_max_speed is not None:
        _set_per_axis_setting(
            api.config.motion_settings.default_max_speed, axis_kind, default_max_speed
        )
    if acceleration is not None:
        _set_per_axis_setting(
            api.config.motion_settings.acceleration, axis_kind, acceleration
        )
    if max_speed_discontinuity is not None:
        _set_per_axis_setting(
            api.config.motion_settings.max_speed_discontinuity,
            axis_kind,
            max_speed_discontinuity,
        )
    if direction_change_speed_discontinuity is not None:
        _set_per_axis_setting(
            api.config.motion_settings.direction_change_speed_discontinuity,
            axis_kind,
            direction_change_speed_discontinuity,
        )


async def set_default_motion_settings(api: ThreadManager[HardwareControlAPI]) -> None:
    default_xy_speed = 1200
    default_xy_acceleration = 2500
    default_z_speed = 500
    default_z_acceleration = 1000
    update_axis_motion_settings(
        api,
        OT3Axis.X,
        default_max_speed=default_xy_speed,
        acceleration=default_xy_acceleration,
        max_speed_discontinuity=0,
        direction_change_speed_discontinuity=0,
    )
    update_axis_motion_settings(
        api,
        OT3Axis.Y,
        default_max_speed=default_xy_speed,
        acceleration=default_xy_acceleration,
        max_speed_discontinuity=0,
        direction_change_speed_discontinuity=0,
    )
    update_axis_motion_settings(
        api,
        OT3Axis.Z_L,
        default_max_speed=default_z_speed,
        acceleration=default_z_acceleration,
        max_speed_discontinuity=0,
        direction_change_speed_discontinuity=0,
    )
    update_axis_motion_settings(
        api,
        OT3Axis.Z_R,
        default_max_speed=default_z_speed,
        acceleration=default_z_acceleration,
        max_speed_discontinuity=0,
        direction_change_speed_discontinuity=0,
    )


async def set_default_settings(api: ThreadManager[HardwareControlAPI]) -> None:
    await set_default_motion_settings(api)
    await set_default_current_settings(api)


async def set_default_current_settings(api: ThreadManager[HardwareControlAPI]) -> None:
    max_motor_current = 1.5
    default_hold_current = 0.2
    update_axis_current_settings(
        api, OT3Axis.X, hold_current=default_hold_current, run_current=max_motor_current
    )
    update_axis_current_settings(
        api, OT3Axis.Y, hold_current=default_hold_current, run_current=max_motor_current
    )
    update_axis_current_settings(
        api,
        OT3Axis.Z_L,
        hold_current=default_hold_current,
        run_current=max_motor_current,
    )
    update_axis_current_settings(
        api,
        OT3Axis.Z_R,
        hold_current=default_hold_current,
        run_current=max_motor_current,
    )


async def home(
    api: ThreadManager[HardwareControlAPI], axes: Optional[List[OT3Axis]] = None
) -> None:
    home_speeds = {
        OT3Axis.X: 90,
        OT3Axis.Y: 90,
        OT3Axis.Z_L: 40,
        OT3Axis.Z_R: 40,
        OT3Axis.Z_G: 10,
        OT3Axis.P_L: 10,
        OT3Axis.P_R: 10,
    }
    for ax, val in home_speeds.items():
        update_axis_motion_settings(api, ax, max_speed_discontinuity=val)
    await api.home()
    await set_default_settings(api)


async def main(api: ThreadManager[HardwareControlAPI]) -> None:
    await api.set_gantry_load(gantry_load=LOAD)
    await set_default_settings(api)
    await home(api)
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
        stop_server()
        hw_api = ThreadManager(HWApi.build_hardware_controller, config=config)

    hw_api.managed_thread_ready_blocking()
    asyncio.run(main(hw_api))
    hw_api.clean_up()
