"""Opentrons helper methods."""
import asyncio
from dataclasses import dataclass, replace
from datetime import datetime
from subprocess import run
from typing import List, Optional, Dict, Tuple

from opentrons.config.robot_configs import build_config_ot3, load_ot3 as load_ot3_config
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEED_DISCONTINUITY
from opentrons.hardware_control.instruments.pipette import Pipette
from opentrons.hardware_control.ot3api import OT3API

from .types import GantryLoad, PerPipetteAxisSettings, OT3Axis, OT3Mount, Point


def stop_server_ot3() -> None:
    """Stop opentrons-robot-server on the OT3."""
    print('Stopping "opentrons-robot-server"...')
    run(["systemctl", "stop", "opentrons-robot-server"])


def stop_on_device_display_ot3() -> None:
    """Stop opentrons on-device-display on the OT3."""
    run(["systemctl", "stop", "opentrons-robot-app"])


def _create_fake_pipette_id(mount: OT3Mount, model: Optional[str]) -> Optional[str]:
    if model is None:
        return None
    items = model.split("_")
    assert len(items) == 3
    size = "P1K" if items[0] == "p1000" else "P50"
    channels = "S" if items[1] == "single" else "M"
    version = items[2].upper().replace(".", "")
    date = datetime.now().strftime("%y%m%d")
    unique_number = 1 if mount == OT3Mount.LEFT else 2
    return f"{size}{channels}{version}{date}A0{unique_number}"


def _create_attached_instruments_dict(
    pipette_left: Optional[str] = None, pipette_right: Optional[str] = None
) -> Dict[OT3Mount, Dict[str, Optional[str]]]:
    fake_id_left = _create_fake_pipette_id(OT3Mount.LEFT, pipette_left)
    fake_id_right = _create_fake_pipette_id(OT3Mount.RIGHT, pipette_right)
    sim_pip_left = {"model": pipette_left, "id": fake_id_left}
    sim_pip_right = {"model": pipette_right, "id": fake_id_right}
    return {OT3Mount.LEFT: sim_pip_left, OT3Mount.RIGHT: sim_pip_right}


async def build_async_ot3_hardware_api(
    is_simulating: Optional[bool] = False,
    use_defaults: Optional[bool] = True,
    pipette_left: Optional[str] = None,
    pipette_right: Optional[str] = None,
) -> OT3API:
    """Built an OT3 Hardware API instance."""
    config = build_config_ot3({}) if use_defaults else load_ot3_config()
    kwargs = {"config": config}
    if is_simulating:
        builder = OT3API.build_hardware_simulator
        # TODO (andy s): add ability to simulate:
        #                - gripper
        #                - 96-channel
        #                - modules
        sim_pips = _create_attached_instruments_dict(pipette_left, pipette_right)
        kwargs["attached_instruments"] = sim_pips  # type: ignore[assignment]
    else:
        builder = OT3API.build_hardware_controller
        stop_server_ot3()
    return await builder(**kwargs)  # type: ignore[arg-type]


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
    api: OT3API,
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
    api: OT3API,
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


async def set_gantry_load_per_axis_settings_ot3(
    api: OT3API,
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
    if load == api.gantry_load:
        await api.set_gantry_load(gantry_load=load)


async def home_ot3(api: OT3API, axes: Optional[List[OT3Axis]] = None) -> None:
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
    await api.engage_axes(which=axes)  # type: ignore[arg-type]
    await asyncio.sleep(0.5)
    await api.home(axes=axes)
    for ax, val in cached_discontinuities.items():
        set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )


def _get_pipette_from_mount(api: OT3API, mount: OT3Mount) -> Pipette:
    pipette = api.hardware_pipettes[mount.to_mount()]
    if pipette is None:
        raise RuntimeError(f"No pipette currently attaced to mount {mount}")
    return pipette


def get_plunger_positions_ot3(
    api: OT3API, mount: OT3Mount
) -> Tuple[float, float, float, float]:
    """Update plunger current."""
    pipette = _get_pipette_from_mount(api, mount)
    cfg = pipette.config
    return cfg.top, cfg.bottom, cfg.blow_out, cfg.drop_tip


async def update_pick_up_current(
    api: OT3API, mount: OT3Mount, current: Optional[float] = 0.125
) -> None:
    """Update pick-up-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    pipette._config = replace(pipette.config, pick_up_current=current)


async def update_pick_up_distance(
    api: OT3API, mount: OT3Mount, distance: Optional[float] = 17.0
) -> None:
    """Update pick-up-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    pipette._config = replace(pipette.config, pick_up_distance=distance)


async def move_plunger_absolute_ot3(
    api: OT3API,
    mount: OT3Mount,
    position: float,
    speed: Optional[float] = None,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    await api._move(
        target_position={OT3Axis.of_main_tool_actuator(mount): position},  # type: ignore[arg-type]
        speed=speed,
    )


async def move_plunger_relative_ot3(
    api: OT3API,
    mount: OT3Mount,
    position: float,
    motor_current: Optional[float] = 1.0,
    speed: Optional[float] = None,
) -> None:
    """Move OT3 plunger position in a relative direction."""
    current_pos = await api.current_position(mount=mount)
    await api._backend.set_active_current(
        {OT3Axis.of_main_tool_actuator(mount): motor_current}  # type: ignore[dict-item]
    )
    plunger_pos = current_pos[OT3Axis.of_main_tool_actuator(mount)]  # type: ignore[index]
    target_pos = {OT3Axis.of_main_tool_actuator(mount): plunger_pos + position}
    await api._move(
        target_position=target_pos,  # type: ignore[arg-type]
        speed=speed,
    )


def get_endstop_position_ot3(api: OT3API, mount: OT3Mount) -> Point:
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
