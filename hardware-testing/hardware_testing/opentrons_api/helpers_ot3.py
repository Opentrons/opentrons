"""Opentrons helper methods."""
from dataclasses import dataclass
from subprocess import run
from typing import List, Optional, Dict, Union, Type, Tuple
from dataclasses import replace

from opentrons.config.robot_configs import build_config_ot3, load_ot3 as load_ot3_config
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEED_DISCONTINUITY
from opentrons.config.pipette_config import PipetteConfig
from opentrons.hardware_control.api import API as OT2API
from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.thread_manager import ThreadManager

from .types import GantryLoad, PerPipetteAxisSettings, OT3Axis, OT3Mount, Point

HWApiOT3: Union[Type[OT3API], Type[OT2API]] = OT3API
ThreadManagedHardwareAPI = ThreadManager[HardwareControlAPI]


def stop_server_ot3() -> None:
    """Stop opentrons-robot-server on the OT3."""
    run(["systemctl", "stop", "opentrons-robot-server"])

def build_ot3_hardware_api(
                            is_simulating: Optional[bool] = False,
                            use_defaults: Optional[bool] = False
                                                ) -> ThreadManagedHardwareAPI:
    """Built an OT3 Hardware API instance."""
    if use_defaults:
        config = build_config_ot3({})
    else:
        config = load_ot3_config()
    """TODO: CF-Need a way to simulate pipettes attached """
    if is_simulating:
        hw_api = ThreadManager(
                                HWApiOT3.build_hardware_simulator,
                                config=config)
    else:
        stop_server_ot3()
        hw_api = ThreadManager(HWApiOT3.build_hardware_controller, config=config)
    hw_api.managed_thread_ready_blocking()
    return hw_api


def set_gantry_per_axis_setting_ot3(
    settings: PerPipetteAxisSettings, axis: OT3Axis, load: GantryLoad, value: float
) -> None:
    """Set a value in an OT3 Gantry's per-axis-settings."""
    axis_kind = OT3Axis.to_kind(axis)
    if load == GantryLoad.HIGH_THROUGHPUT:
        settings.high_throughput[axis_kind] = value
    elif load == GantryLoad.LOW_THROUGHPUT:
        settings.low_throughput[axis_kind] = value
    elif load == GantryLoad.TWO_LOW_THROUGHPUT:
        settings.two_low_throughput[axis_kind] = value
    elif load == GantryLoad.NONE:
        settings.none[axis_kind] = value
    elif load == GantryLoad.GRIPPER:
        settings.gripper[axis_kind] = value


def set_gantry_load_per_axis_current_settings_ot3(
    api: ThreadManagedHardwareAPI,
    axis: OT3Axis,
    load: Optional[GantryLoad] = None,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> None:
    """Update an OT3 axis current settings."""
    if load is None:
        load = api.gantry_load
    if hold_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.hold_current,
            axis=axis,
            load=load,
            value=hold_current,
        )
    if run_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.run_current,
            axis=axis,
            load=load,
            value=run_current,
        )


def set_gantry_load_per_axis_motion_settings_ot3(
    api: ThreadManagedHardwareAPI,
    axis: OT3Axis,
    load: Optional[GantryLoad] = None,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> None:
    """Update an OT3 axis motion settings."""
    if load is None:
        load = api.gantry_load
    if default_max_speed is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.default_max_speed,
            axis=axis,
            load=load,
            value=default_max_speed,
        )
    if acceleration is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.acceleration,
            axis=axis,
            load=load,
            value=acceleration,
        )
    if max_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.max_speed_discontinuity,
            axis=axis,
            load=load,
            value=max_speed_discontinuity,
        )
    if direction_change_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.direction_change_speed_discontinuity,
            axis=axis,
            load=load,
            value=direction_change_speed_discontinuity,
        )


@dataclass
class GantryLoadSettings:
    """Gantry Load Settings."""

    max_speed: float  # mm/sec
    acceleration: float  # mm/sec**2
    max_start_stop_speed: float  # mm/sec
    max_change_dir_speed: float  # mm/sec
    hold_current: float  # amps
    run_current: float  # amps


def set_gantry_load_per_axis_settings_ot3(
    api: ThreadManagedHardwareAPI,
    settings: Dict[OT3Axis, GantryLoadSettings],
    load: Optional[GantryLoad] = None,
) -> None:
    """Set motion/current settings, per-axis, per-gantry-load."""
    if load is None:
        load = api.gantry_load
    for ax, stg in settings.items():
        set_gantry_load_per_axis_motion_settings_ot3(
            api,
            ax,
            load,
            default_max_speed=stg.max_speed,
            acceleration=stg.acceleration,
            max_speed_discontinuity=stg.max_start_stop_speed,
            direction_change_speed_discontinuity=stg.max_change_dir_speed,
        )
        set_gantry_load_per_axis_current_settings_ot3(
            api, ax, load, hold_current=stg.hold_current, run_current=stg.run_current
        )


async def home_ot3(
    api: ThreadManagedHardwareAPI, axes: Optional[List[OT3Axis]] = None
) -> None:
    """Home OT3 gantry."""
    _all_axes = [
        OT3Axis.X,
        OT3Axis.Y,
        OT3Axis.Z_L,
        OT3Axis.Z_R,
        OT3Axis.Z_G,
        OT3Axis.P_L,
        OT3Axis.P_R,
    ]
    default_home_speed = 10
    max_speeds_for_load = DEFAULT_MAX_SPEED_DISCONTINUITY[api.gantry_load]
    homing_speeds: Dict[OT3Axis, float] = {
        ax: max_speeds_for_load.get(OT3Axis.to_kind(ax), default_home_speed)
        for ax in _all_axes
    }
    cached_discontinuities: Dict[OT3Axis, float] = {
        ax: api.config.motion_settings.max_speed_discontinuity[api.gantry_load].get(
            OT3Axis.to_kind(ax), default_home_speed
        )
        for ax in _all_axes
    }
    for ax, val in homing_speeds.items():
        set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )
    await api.home(axes=axes)
    for ax, val in cached_discontinuities.items():
        set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )


async def home_pipette(api: ThreadManagedHardwareAPI, mount: OT3Mount):
    """Home Plunger"""
    await api.home_plunger(mount)


def get_plunger_positions_ot3(api: ThreadManagedHardwareAPI,
                              mount: OT3Mount) -> Tuple[float, float, float, float]:
    cfg = api.hardware_pipettes[mount]
    return cfg.top, cfg.bottom, cfg.blow_out, cfg.drop_tip


async def update_pick_up_current(api: ThreadManagedHardwareAPI,
                              mount: OT3Mount,
                              current: Optional[float] = 0.125):
    hw_instr = api._pipette_handler.get_pipette(mount)
    realmount = OT3Mount.from_mount(mount)
    old_pickup = api._pipette_handler.hardware_instruments[mount]._config.pick_up_current
    print(f"Pick_up_current:{old_pickup}")
    hw_instr._config = replace(hw_instr._config, pick_up_current = current)
    new_pickup = api._pipette_handler.hardware_instruments[mount]._config.pick_up_current
    print(f"Pick_up_current:{new_pickup}")
    spec, _add_tip_to_instrs = api._pipette_handler.plan_check_pick_up_tip(
        realmount, 78.3, 1, 0
    )
    print(f"specs: {spec.presses}")

async def update_pick_up_distance(api: ThreadManagedHardwareAPI,
                              mount: OT3Mount,
                              distance: Optional[float] = 17.0):
    #default pick_up_distance = 17
    hw_instr = api._pipette_handler.get_pipette(mount)
    old_pickup_distance = api._pipette_handler.hardware_instruments[mount]._config.pick_up_distance
    print(f"Pick_up_distance:{old_pickup_distance}")
    hw_instr._config = replace(hw_instr._config, pick_up_distance = distance)
    new_pickup_distance = api._pipette_handler.hardware_instruments[mount]._config.pick_up_distance
    print(f"Pick_up_distance:{new_pickup_distance}")

async def move_plunger_absolute_ot3(api: ThreadManagedHardwareAPI,
                                    mount: OT3Mount,
                                    position: float,
                                    motor_current: Optional[float] = 1.0,
                                    speed: Optional[float] = None) -> None:
    """
    hw_instr = hw.hardware_pipettes[instrument._implementation._mount]
    old_pickup = hw_instr._config.pick_up_current
    try:
        hw_instr._config = replace(hw_instr._config, pick_up_current=0.125)
        instrument.pick_up_tip(tip, presses=1, increment=0.5)
    finally:
        hw_instr._config = replace(hw_instr._config, pick_up_current=old_pickup)
    """
    await api._move(
                target_position={
                    OT3Axis.of_main_tool_actuator(mount): position},
                speed=speed)


async def move_plunger_relative_ot3(api: ThreadManagedHardwareAPI,
                                    mount: OT3Mount,
                                    position: float,
                                    motor_current: Optional[float] = 1.0,
                                    speed: Optional[float] = None) -> None:
    current_pos = await api.current_position(mount=mount)
    await api._backend.set_active_current(
                                {OT3Axis.of_main_tool_actuator(mount): motor_current})
    plunger_pos = current_pos[OT3Axis.of_main_tool_actuator(mount)]
    await api._move(
                target_position={OT3Axis.of_main_tool_actuator(mount):
                                    plunger_pos + position
                                    },
                speed=speed)


def get_endstop_position_ot3(api: ThreadManagedHardwareAPI, mount: OT3Mount) -> Point:
    """Get the endstop's position per mount."""
    if mount == OT3Mount.LEFT:
        mount_offset = api.config.left_mount_offset
    elif mount == OT3Mount.RIGHT:
        mount_offset = api.config.right_mount_offset
    elif mount == OT3Mount.GRIPPER:
        mount_offset = api.config.gripper_mount_offset
    else:
        raise ValueError(f"Unexpected mount type: {mount}")
    return Point(
        x=api.config.carriage_offset[0] + mount_offset[0],
        y=api.config.carriage_offset[1] + mount_offset[1],
        z=api.config.carriage_offset[2] + mount_offset[2],
    )
