"""Opentrons helper methods."""
from dataclasses import dataclass, replace
from datetime import datetime
from subprocess import run
from time import time
from typing import List, Optional, Dict, Tuple

from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons_hardware.sensors import sensor_driver, sensor_types

from opentrons.config.robot_configs import build_config_ot3, load_ot3 as load_ot3_config
from opentrons.hardware_control.backends.ot3utils import sensor_node_for_mount

# TODO (lc 10-27-2022) This should be changed to an ot3 pipette object once we
# have that well defined.
from opentrons.hardware_control.instruments.ot2.pipette import Pipette
from opentrons.hardware_control.motion_utilities import deck_from_machine
from opentrons.hardware_control.ot3api import OT3API

from .types import (
    GantryLoad,
    PerPipetteAxisSettings,
    OT3Axis,
    OT3Mount,
    Point,
    CriticalPoint,
)


def stop_server_ot3() -> None:
    """Stop opentrons-robot-server on the OT3."""
    print('Stopping "opentrons-robot-server"...')
    run(["systemctl", "stop", "opentrons-robot-server"])


def restart_canbus_ot3() -> None:
    """Restart opentrons-ot3-canbus on the OT3."""
    print('Restarting "opentrons-ot3-canbus"...')
    run(["systemctl", "restart", "opentrons-ot3-canbus"])


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
        restart_canbus_ot3()
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
    default_home_speed = 10.0
    default_home_speed_xy = 40.0

    homing_speeds: Dict[OT3Axis, float] = {
        OT3Axis.X: default_home_speed_xy,
        OT3Axis.Y: default_home_speed_xy,
        OT3Axis.Z_L: default_home_speed,
        OT3Axis.Z_R: default_home_speed,
        OT3Axis.Z_G: default_home_speed,
        OT3Axis.P_L: default_home_speed,
        OT3Axis.P_R: default_home_speed,
    }

    # save our current script's settings
    cached_discontinuities: Dict[OT3Axis, float] = {
        ax: api.config.motion_settings.max_speed_discontinuity[api.gantry_load].get(
            OT3Axis.to_kind(ax), homing_speeds[ax]
        )
        for ax in homing_speeds
    }
    # overwrite current settings with API settings
    for ax, val in homing_speeds.items():
        set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )
    # actually home
    await api.home(axes=axes)
    # revert back to our script's settings
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
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    if not api.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError(f"No pipette found on mount: {mount}")
    plunger_axis = OT3Axis.of_main_tool_actuator(mount)
    _move_coro = api._move(
        target_position={plunger_axis: position},  # type: ignore[arg-type]
        speed=speed,
    )
    if motor_current is None:
        await _move_coro
    else:
        async with api._backend.restore_current():
            await api._backend.set_active_current(
                {OT3Axis.of_main_tool_actuator(mount): motor_current}  # type: ignore[dict-item]
            )
            await _move_coro


async def move_plunger_relative_ot3(
    api: OT3API,
    mount: OT3Mount,
    delta: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move OT3 plunger position in a relative direction."""
    current_pos = await api.current_position_ot3(mount=mount)
    plunger_axis = OT3Axis.of_main_tool_actuator(mount)
    plunger_pos = current_pos[plunger_axis]
    return await move_plunger_absolute_ot3(
        api, mount, plunger_pos + delta, motor_current, speed
    )


def get_endstop_position_ot3(api: OT3API, mount: OT3Mount) -> Dict[OT3Axis, float]:
    """Get the endstop's position per mount."""
    transforms = api._transforms
    machine_pos_per_axis = api._backend.home_position()
    deck_pos_per_axis = deck_from_machine(
        machine_pos_per_axis,
        transforms.deck_calibration.attitude,
        transforms.carriage_offset,
    )
    mount_pos_per_axis = api._effector_pos_from_carriage_pos(
        mount, deck_pos_per_axis, None
    )
    return {ax: val for ax, val in mount_pos_per_axis.items()}


class OT3JogTermination(Exception):
    """Jogging terminated."""

    pass


class OT3JogNoInput(Exception):
    """No jogging input from user."""

    pass


def _jog_read_user_input(terminator: str, home_key: str) -> Tuple[str, float, bool]:
    user_input = input(f'Jog eg: x-10.5 ("{terminator}" to stop): ')
    user_input = user_input.strip().replace(" ", "")
    if user_input == terminator:
        raise OT3JogTermination()
    if not user_input:
        raise OT3JogNoInput()
    if home_key in user_input:
        user_input = user_input.replace(home_key, "")
        do_home = True
        distance = 0.0
    else:
        do_home = False
        distance = float(user_input[1:])
    axis = user_input[0].upper()
    if axis not in "XYZPG":
        raise ValueError(f'Unexpected axis: "{axis}"')
    return axis, distance, do_home


async def _jog_axis_some_distance(
    api: OT3API, mount: OT3Mount, axis: str, distance: float
) -> None:
    if not axis or distance == 0.0:
        return
    elif axis == "G":
        raise RuntimeError("Gripper jogging not yet supported")
    elif axis == "P":
        await move_plunger_relative_ot3(api, mount, distance)
    else:
        delta = Point(**{axis.lower(): distance})
        await api.move_rel(mount=mount, delta=delta)


async def _jog_print_current_position(
    api: OT3API, mount: OT3Mount, critical_point: Optional[CriticalPoint] = None
) -> None:
    z_axis = OT3Axis.by_mount(mount)
    plunger_axis = OT3Axis.of_main_tool_actuator(mount)
    motors_pos = await api.current_position_ot3(
        mount=mount, critical_point=critical_point
    )
    enc_pos = await api.encoder_current_position(
        mount=mount, critical_point=critical_point
    )
    mx, my, mz, mp = [
        round(motors_pos.get(ax), 2)
        for ax in [OT3Axis.X, OT3Axis.Y, z_axis, plunger_axis]
    ]
    ex, ey, ez, ep = [
        round(enc_pos.get(ax.to_axis()), 2)
        for ax in [OT3Axis.X, OT3Axis.Y, z_axis, plunger_axis]
    ]
    print(f"Deck Coordinate: X={mx}, Y={my}, Z={mz}, P={mp}")
    print(f"Enc. Coordinate: X={ex}, Y={ey}, Z={ez}, P={ep}")


async def _jog_do_print_then_input_then_move(
    api: OT3API,
    mount: OT3Mount,
    critical_point: Optional[CriticalPoint],
    axis: str,
    distance: float,
    do_home: bool,
) -> Tuple[str, float, bool]:
    try:
        await _jog_print_current_position(api, mount, critical_point)
        axis, distance, do_home = _jog_read_user_input(
            terminator="stop", home_key="home"
        )
    except OT3JogNoInput:
        print("No input, repeating previous jog")
    if do_home:
        str_to_axes = {
            "X": OT3Axis.X,
            "Y": OT3Axis.Y,
            "Z": OT3Axis.by_mount(mount),
            "P": OT3Axis.of_main_tool_actuator(mount),
            "G": OT3Axis.G,
            "Q": OT3Axis.Q,
        }
        await api.home([str_to_axes[axis]])
    else:
        await _jog_axis_some_distance(api, mount, axis, distance)
    return axis, distance, do_home


async def jog_mount_ot3(
    api: OT3API, mount: OT3Mount, critical_point: Optional[CriticalPoint] = None
) -> Dict[OT3Axis, float]:
    """Jog an OT3 mount's gantry XYZ and pipettes axes."""
    axis: str = ""
    distance: float = 0.0
    do_home: bool = False
    while True:
        try:
            axis, distance, do_home = await _jog_do_print_then_input_then_move(
                api, mount, critical_point, axis, distance, do_home
            )
        except ValueError as e:
            print(e)
            continue
        except OT3JogTermination:
            print("Done jogging")
            return await api.current_position_ot3(
                mount=mount, critical_point=critical_point
            )


async def move_to_arched_ot3(
    api: OT3API,
    mount: OT3Mount,
    abs_position: Point,
    speed: Optional[float] = None,
    safe_height: float = -100.0,
) -> None:
    """Move OT3 gantry in an arched path."""
    z_ax = OT3Axis.by_mount(mount)
    max_z = get_endstop_position_ot3(api, mount)[z_ax] - 1
    here = await api.gantry_position(mount=mount, refresh=True)
    arch_z = min(max(here.z, safe_height), max_z)
    points = [
        here._replace(z=arch_z),
        abs_position._replace(z=arch_z),
        abs_position,
    ]
    for p in points:
        await api.move_to(mount=mount, abs_position=p, speed=speed)


async def get_capacitance_ot3(api: OT3API, mount: OT3Mount) -> float:
    """Get the capacitance reading from the pipette."""
    if api.is_simulator:
        return 0.0
    node_id = sensor_node_for_mount(mount)
    capacitive = sensor_types.CapacitiveSensor.build(SensorId.S0, node_id)
    s_driver = sensor_driver.SensorDriver()
    data = await s_driver.read(
        api._backend._messenger, capacitive, offset=False, timeout=1  # type: ignore[union-attr]
    )
    if data is None:
        raise ValueError("Unexpected None value from sensor")
    return data.to_float()  # type: ignore[union-attr]


async def wait_for_stable_capacitance_ot3(
    api: OT3API,
    mount: OT3Mount,
    threshold_pf: float,
    duration: float,
    retries: int = 10,
) -> None:
    """Wait for the pipette capacitance to be stable."""
    if api.is_simulator:
        return
    data = list()

    async def _read() -> None:
        cap_val = await get_capacitance_ot3(api, mount)
        data.append(
            (
                time(),
                cap_val,
            )
        )

    def _data_duration() -> float:
        if len(data) < 2:
            return 0.0
        return data[-1][0] - data[0][0]

    def _data_stats() -> Tuple[float, float]:
        cap_data = [d[1] for d in data]
        avg = sum(cap_data) / len(cap_data)
        var = max(cap_data) - min(cap_data)
        return avg, var

    print(f"Waiting for {duration} seconds of stable capacitance, please wait...")
    while _data_duration() < duration:
        await _read()

    average, variance = _data_stats()
    print(
        f"Read {len(data)} samples in {_data_duration()} seconds "
        f"(average={average}, variance={variance})"
    )
    if variance > threshold_pf or variance == 0.0:
        if retries <= 0:
            raise RuntimeError("Unable to get stable capacitance reading")
        print("Unstable, repeating...")
        await wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf, duration, retries - 1
        )
