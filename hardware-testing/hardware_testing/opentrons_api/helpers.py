"""Opentrons helper methods."""
from subprocess import run
from types import MethodType
from typing import Any, List, Optional, Dict

from opentrons import protocol_api, execute, simulate
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEED_DISCONTINUITY
from opentrons.config.types import GantryLoad, PerPipetteAxisSettings
from opentrons.protocol_api.labware import Well
from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.thread_manager import (
    ThreadManager,
    ThreadManagerException,
)
from opentrons.hardware_control.types import OT3Axis

from .workarounds import is_running_in_app, store_robot_acceleration


def _add_fake_simulate(
    ctx: protocol_api.ProtocolContext, is_simulating: bool
) -> protocol_api.ProtocolContext:
    def _is_simulating(_: protocol_api.ProtocolContext) -> bool:
        return is_simulating

    setattr(ctx, "is_simulating", MethodType(_is_simulating, ctx))
    return ctx


def _add_fake_comment_pause(
    ctx: protocol_api.ProtocolContext,
) -> protocol_api.ProtocolContext:
    def _comment(_: protocol_api.ProtocolContext, a: Any) -> None:
        print(a)

    def _pause(_: protocol_api.ProtocolContext, a: Any) -> None:
        input(a)

    setattr(ctx, "comment", MethodType(_comment, ctx))
    setattr(ctx, "pause", MethodType(_pause, ctx))
    return ctx


def get_api_context(
    api_level: str, is_simulating: bool = False, connect_to_smoothie: bool = True
) -> protocol_api.ProtocolContext:
    """Create an Opentrons API ProtocolContext instance."""
    able_to_execute = False
    ctx = None
    if not is_simulating and connect_to_smoothie:
        try:
            ctx = execute.get_protocol_api(api_level)
            able_to_execute = True
        except ThreadManagerException:
            # Unable to build non-simulated Protocol Context
            # Probably be running on a non-Linux machine
            # Creating simulated Protocol Context, with .is_simulated() overridden
            pass
    if not able_to_execute or is_simulating or not connect_to_smoothie:
        ctx = simulate.get_protocol_api(api_level)
    assert ctx
    if not able_to_execute or not connect_to_smoothie:
        _add_fake_simulate(ctx, is_simulating)
    if not is_running_in_app():
        _add_fake_comment_pause(ctx)
    # NOTE: goshdarnit, all robots will have slower acceleration
    store_robot_acceleration()
    return ctx


def well_is_reservoir(well: protocol_api.labware.Well) -> bool:
    """Well is reservoir."""
    return "reservoir" in well.parent.load_name


def get_list_of_wells_affected(
    pipette: protocol_api.InstrumentContext, well: Well
) -> List[Well]:
    """Get list of wells affected."""
    if pipette.channels > 1 and not well_is_reservoir(well):
        well_col = well.well_name[1:]  # the "1" in "A1"
        wells_list = [w for w in well.parent.columns_by_name()[well_col]]
        assert well in wells_list, "Well is not inside column"
    else:
        wells_list = [well]
    return wells_list


def get_pipette_unique_name(pipette: protocol_api.InstrumentContext) -> str:
    """Get a pipette's unique name."""
    return str(pipette.hw_pipette["pipette_id"])


def stop_server_ot3() -> None:
    """Stop opentrons-robot-server on the OT3."""
    run(["systemctl", "stop", "opentrons-robot-server"])


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


def update_axis_current_settings_ot3(
    api: ThreadManager[HardwareControlAPI],
    axis: OT3Axis,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> None:
    """Update an OT3 axis current settings."""
    if hold_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.hold_current,
            axis=axis,
            load=api.gantry_load,
            value=hold_current,
        )
    if run_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.run_current,
            axis=axis,
            load=api.gantry_load,
            value=run_current,
        )


def update_axis_motion_settings_ot3(
    api: ThreadManager[HardwareControlAPI],
    axis: OT3Axis,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> None:
    """Update an OT3 axis motion settings."""
    if default_max_speed is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.default_max_speed,
            axis=axis,
            load=GantryLoad.NONE,
            value=default_max_speed,
        )
    if acceleration is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.acceleration,
            axis=axis,
            load=GantryLoad.NONE,
            value=acceleration,
        )
    if max_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.max_speed_discontinuity,
            axis=axis,
            load=GantryLoad.NONE,
            value=max_speed_discontinuity,
        )
    if direction_change_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.direction_change_speed_discontinuity,
            axis=axis,
            load=GantryLoad.NONE,
            value=direction_change_speed_discontinuity,
        )


async def home_ot3(
    api: ThreadManager[HardwareControlAPI], axes: Optional[List[OT3Axis]] = None
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
    homing_speeds: Dict[OT3Axis, float] = {
        ax: DEFAULT_MAX_SPEED_DISCONTINUITY[api.gantry_load][OT3Axis.to_kind(ax)]
        for ax in _all_axes
    }
    cached_discontinuities: Dict[OT3Axis, float] = {
        ax: api.config.motion_settings.max_speed_discontinuity[api.gantry_load][
            OT3Axis.to_kind(ax)
        ]
        for ax in _all_axes
    }
    for ax, val in homing_speeds.items():
        update_axis_motion_settings_ot3(api, ax, max_speed_discontinuity=val)
    await api.home(axes=axes)
    for ax, val in cached_discontinuities.items():
        update_axis_motion_settings_ot3(api, ax, max_speed_discontinuity=val)
