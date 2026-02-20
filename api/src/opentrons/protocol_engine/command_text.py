"""Annotate protocol engine commands with human-readable text keys and params.

This module adds commandTextKey and commandTextParams to commands so consumers
(App, opentrons_simulate) can render localized command text from
protocol_command_text without reimplementing getter logic.

Keys and param names match the frontend's protocol_command_text.json and
CommandText getters (useCommandTextString).
"""

from __future__ import annotations

from typing import (
    Any,
    Dict,
    List,
    Optional,
    Union,
)

from opentrons_shared_data.robot.types import RobotType

from .commands import Command
from .state.state_summary import StateSummary
from .types import (
    DeckSlotLocation,
    LabwareLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    ModuleLocation,
    OnLabwareLocation,
)

# Command types that map 1:1 to a single protocol_command_text key (no params).
# Mirrors getDirectTranslationCommandText in components.
_DIRECT_TRANSLATION_KEY_BY_COMMAND_TYPE: Dict[str, str] = {
    "home": "home_gantry",
    "savePosition": "save_position",
    "touchTip": "touch_tip",
    "getNextTip": "get_next_tip",
    "magneticModule/engage": "engaging_magnetic_module",
    "magneticModule/disengage": "disengaging_magnetic_module",
    "temperatureModule/deactivate": "deactivate_temperature_module",
    "thermocycler/waitForBlockTemperature": "waiting_for_tc_block_to_reach",
    "thermocycler/waitForLidTemperature": "waiting_for_tc_lid_to_reach",
    "thermocycler/openLid": "opening_tc_lid",
    "thermocycler/closeLid": "closing_tc_lid",
    "thermocycler/deactivateBlock": "deactivating_tc_block",
    "thermocycler/deactivateLid": "deactivating_tc_lid",
    "thermocycler/awaitProfileComplete": "tc_awaiting_for_duration",
    "heaterShaker/deactivateHeater": "deactivating_hs_heater",
    "heaterShaker/openLabwareLatch": "unlatching_hs_latch",
    "heaterShaker/closeLabwareLatch": "latching_hs_latch",
    "heaterShaker/deactivateShaker": "deactivate_hs_shake",
    "heaterShaker/waitForTemperature": "waiting_for_hs_to_reach",
    "waitForResume": "wait_for_resume",
    "pause": "wait_for_resume",
    "waitForTasks": "wait_for_tasks",
    "robot/openGripperJaw": "robot_open_gripper_jaw",
    "robot/closeGripperJaw": "robot_close_gripper_jaw",
    "loadLid": "load_lid",
    "absorbanceReader/openLid": "absorbance_reader_open_lid",
    "absorbanceReader/closeLid": "absorbance_reader_close_lid",
    "absorbanceReader/read": "absorbance_reader_read",
    "flexStacker/empty": "empty_stacker",
    "flexStacker/fill": "fill_stacker",
}


def _format_decimal(value: Optional[Union[int, float]]) -> str:
    """Format a number for display (strip trailing zeros after decimal)."""
    if value is None:
        return ""
    if isinstance(value, int):
        return str(value)
    s = f"{float(value):.2f}".rstrip("0").rstrip(".")
    return s


def _format_track_location(track_loc: Any) -> str:
    """Format trackFromLocation/trackToLocation for aspirate/dispense while tracking."""
    if track_loc is None:
        return ""
    origin = getattr(track_loc, "origin", None)
    offset = getattr(track_loc, "offset", None) or {}
    prefix = "meniscus+" if origin == "meniscus" else ""
    x = getattr(offset, "x", 0) or 0
    y = getattr(offset, "y", 0) or 0
    z = getattr(offset, "z", 0) or 0
    return f"{prefix}({x}, {y}, {z})"


def _get_labware_display_name(
    labware_id: str,
    labware_list: List[LoadedLabware],
) -> str:
    """Resolve labware display name from state (displayName or loadName)."""
    for lw in labware_list:
        if lw.id == labware_id:
            return lw.displayName or lw.loadName
    return ""


def _get_labware_location_display_string(
    location: LabwareLocation,
    modules: List[LoadedModule],
    labware_list: List[LoadedLabware],
) -> str:
    """Produce a short display string for labware location (e.g. 'Slot 1', 'Temperature Module in Slot 3')."""
    if isinstance(location, DeckSlotLocation):
        return f"Slot {location.slotName}"
    if isinstance(location, ModuleLocation):
        for mod in modules:
            if mod.id == location.moduleId:
                # Module model to display name: e.g. temperatureModuleV2 -> Temperature Module
                model = getattr(mod, "model", None) or ""
                if "temperature" in model.lower():
                    return f"Temperature Module in Slot {_module_slot_or_unknown(mod)}"
                if "magnetic" in model.lower():
                    return f"Magnetic Module in Slot {_module_slot_or_unknown(mod)}"
                if "thermocycler" in model.lower() or "thermo" in model.lower():
                    return f"Thermocycler in Slot {_module_slot_or_unknown(mod)}"
                if "heater" in model.lower() or "heaterShaker" in model.lower():
                    return f"Heater-Shaker in Slot {_module_slot_or_unknown(mod)}"
                return f"Module in Slot {_module_slot_or_unknown(mod)}"
        return "on module"
    if isinstance(location, OnLabwareLocation):
        parent_name = _get_labware_display_name(location.labwareId, labware_list)
        return f"on {parent_name}" if parent_name else "on labware"
    # AddressableAreaLocation, off-deck, etc.
    return str(location)


def _module_slot_or_unknown(mod: LoadedModule) -> str:
    """Get slot name for a module if available."""
    loc = getattr(mod, "location", None)
    if loc is not None and hasattr(loc, "slotName"):
        return str(loc.slotName)
    return "?"


def _get_pipette_display_name(
    pipette_id: str,
    pipettes: List[LoadedPipette],
) -> str:
    """Resolve pipette display name from state (pipetteName as fallback)."""
    for p in pipettes:
        if p.id == pipette_id:
            return str(getattr(p, "pipetteName", "") or "")
    return ""


def _annotate_pipetting_command(
    command: Command,
    state_summary: StateSummary,
) -> None:
    """Set commandTextKey and commandTextParams for pipetting commands."""
    params = getattr(command, "params", None)
    if params is None:
        return
    labware_id: Optional[str] = getattr(params, "labwareId", None)
    well_name: str = getattr(params, "wellName", "") or ""
    volume = getattr(params, "volume", None)
    flow_rate = getattr(params, "flowRate", None)

    labware_name = _get_labware_display_name(labware_id or "", state_summary.labware)
    labware_location = ""
    if labware_id:
        for lw in state_summary.labware:
            if lw.id == labware_id:
                labware_location = _get_labware_location_display_string(
                    lw.location,
                    state_summary.modules,
                    state_summary.labware,
                )
                break

    command_type = getattr(command, "commandType", "")
    key: Optional[str] = None
    text_params: Dict[str, Union[str, float]] = {}

    push_out = getattr(params, "pushOut", None)

    if command_type == "aspirate":
        key = "aspirate"
        text_params = {
            "well_name": well_name,
            "labware": labware_name,
            "labware_location": labware_location,
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "aspirateInPlace":
        key = "aspirate_in_place"
        text_params = {
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "dispense":
        if push_out is not None:
            key = "dispense_push_out"
            text_params = {
                "well_name": well_name,
                "labware": labware_name,
                "labware_location": labware_location,
                "volume": _format_decimal(volume),
                "flow_rate": _format_decimal(flow_rate),
                "push_out_volume": _format_decimal(push_out),
            }
        else:
            key = "dispense"
            text_params = {
                "well_name": well_name,
                "labware": labware_name,
                "labware_location": labware_location,
                "volume": _format_decimal(volume),
                "flow_rate": _format_decimal(flow_rate),
            }
    elif command_type == "dispenseInPlace":
        key = "dispense_in_place"
        text_params = {
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "blowout":
        key = "blowout"
        text_params = {
            "well_name": well_name,
            "labware": labware_name,
            "labware_location": labware_location,
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "blowOutInPlace":
        key = "blowout_in_place"
        text_params = {"flow_rate": _format_decimal(flow_rate)}
    elif command_type == "pickUpTip":
        key = "pickup_tip"
        text_params = {
            "well_range": well_name,
            "labware": labware_name,
            "labware_location": labware_location,
        }
    elif command_type == "dropTip":
        key = "drop_tip"
        text_params = {
            "well_name": well_name,
            "labware": labware_name,
        }
    elif command_type == "dropTipInPlace":
        key = "drop_tip_in_place"
        text_params = {}
    elif command_type == "airGapInPlace":
        key = "air_gap_in_place"
        text_params = {"volume": _format_decimal(volume)}
    elif command_type == "sealPipetteToTip":
        key = "sealing_to_location"
        text_params = {"labware": labware_name, "location": labware_location}
    elif command_type == "unsealPipetteFromTip":
        key = "unsealing_from_location"
        text_params = {"labware": labware_name, "location": labware_location}
    elif command_type == "pressureDispense":
        key = "pressurizing_to_dispense"
        text_params = {
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "aspirateWhileTracking":
        track_from = getattr(params, "trackFromLocation", None)
        track_to = getattr(params, "trackToLocation", None)
        from_str = _format_track_location(track_from) if track_from else ""
        to_str = _format_track_location(track_to) if track_to else ""
        key = "aspirate_while_tracking"
        text_params = {
            "well_name": well_name,
            "track_from_location": from_str,
            "track_to_location": to_str,
            "labware": labware_name,
            "labware_location": labware_location,
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    elif command_type == "dispenseWhileTracking":
        track_from = getattr(params, "trackFromLocation", None)
        track_to = getattr(params, "trackToLocation", None)
        from_str = _format_track_location(track_from) if track_from else ""
        to_str = _format_track_location(track_to) if track_to else ""
        key = "dispense_while_tracking"
        text_params = {
            "well_name": well_name,
            "track_from_location": from_str,
            "track_to_location": to_str,
            "labware": labware_name,
            "labware_location": labware_location,
            "volume": _format_decimal(volume),
            "flow_rate": _format_decimal(flow_rate),
        }
    else:
        key = None

    if key is not None:
        command.commandTextKey = key
        command.commandTextParams = text_params if text_params else None


def _annotate_comment_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for comment."""
    params = getattr(command, "params", None)
    message = getattr(params, "message", "") if params else ""
    command.commandTextKey = "comment"
    command.commandTextParams = {"message": message}


def _annotate_wait_for_duration_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for waitForDuration."""
    params = getattr(command, "params", None)
    if params is None:
        return
    seconds = getattr(params, "seconds", 0) or 0
    message = getattr(params, "message", None) or ""
    command.commandTextKey = "wait_for_duration"
    command.commandTextParams = {"seconds": str(int(seconds)), "message": str(message)}


def _annotate_temperature_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for temperature module/TC/HS temp commands."""
    key_by_type: Dict[str, str] = {
        "temperatureModule/setTargetTemperature": "setting_temperature_module_temp",
        "temperatureModule/waitForTemperature": "waiting_to_reach_temp_module",
        "thermocycler/setTargetBlockTemperature": "setting_thermocycler_block_temp",
        "thermocycler/setTargetLidTemperature": "setting_thermocycler_lid_temp",
        "heaterShaker/setTargetTemperature": "setting_hs_temp",
    }
    command_type = getattr(command, "commandType", "")
    key = key_by_type.get(command_type)
    if not key:
        return
    params = getattr(command, "params", None)
    celsius = getattr(params, "celsius", None) if params else None
    hold = getattr(params, "holdTimeSeconds", 0) if params else 0
    temp_str = f"{celsius}°C" if celsius is not None else "target temperature"
    command.commandTextKey = key
    command.commandTextParams = {"temp": temp_str, "hold_time_seconds": str(hold)}


def _annotate_move_relative_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for moveRelative."""
    params = getattr(command, "params", None)
    if params is None:
        return
    axis = getattr(params, "axis", "")
    distance = getattr(params, "distance", 0)
    command.commandTextKey = "move_relative"
    command.commandTextParams = {"axis": str(axis), "distance": _format_decimal(distance)}


def _annotate_move_to_slot_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for moveToSlot."""
    params = getattr(command, "params", None)
    if params is None:
        return
    slot_name = getattr(params, "slotName", "")
    command.commandTextKey = "move_to_slot"
    command.commandTextParams = {"slot_name": str(slot_name)}


def _annotate_move_to_coordinates_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for moveToCoordinates."""
    params = getattr(command, "params", None)
    if params is None:
        return
    coords = getattr(params, "coordinates", None) or {}
    x = coords.get("x", 0) if isinstance(coords, dict) else getattr(coords, "x", 0)
    y = coords.get("y", 0) if isinstance(coords, dict) else getattr(coords, "y", 0)
    z = coords.get("z", 0) if isinstance(coords, dict) else getattr(coords, "z", 0)
    command.commandTextKey = "move_to_coordinates"
    command.commandTextParams = {"x": _format_decimal(x), "y": _format_decimal(y), "z": _format_decimal(z)}


def _annotate_set_rail_lights_command(command: Command) -> None:
    """Set commandTextKey for setRailLights (on -> turning_rail_lights_on, else turning_rail_lights_off)."""
    params = getattr(command, "params", None)
    on = getattr(params, "on", False) if params else False
    command.commandTextKey = "turning_rail_lights_on" if on else "turning_rail_lights_off"
    command.commandTextParams = None


def _annotate_delay_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for legacy delay command."""
    params = getattr(command, "params", None)
    if params is None:
        return
    if getattr(params, "waitForResume", None) is not None:
        command.commandTextKey = "wait_for_resume"
        command.commandTextParams = None
    else:
        seconds = getattr(params, "seconds", 0) or 0
        message = getattr(params, "message", "") or ""
        command.commandTextKey = "wait_for_duration"
        command.commandTextParams = {"seconds": str(int(seconds)), "message": str(message)}


def _annotate_custom_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for custom command."""
    params = getattr(command, "params", None)
    legacy = getattr(params, "legacyCommandText", None) if params else None
    if legacy is not None:
        text = str(legacy) if not isinstance(legacy, dict) else str(legacy)
    else:
        text = f"{getattr(command, 'commandType', 'custom')}: {params}"
    command.commandTextKey = "comment"
    command.commandTextParams = {"message": text}


def _annotate_create_timer_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for createTimer."""
    params = getattr(command, "params", None)
    if params is None:
        return
    time_sec = getattr(params, "time", 0) or 0
    command.commandTextKey = "create_timer"
    command.commandTextParams = {"seconds": str(int(time_sec))}


def _format_axis_map(axis_map: Any) -> str:
    """Format axis_map for robot move commands (simplified: key: value, ...)."""
    if axis_map is None:
        return "()"
    if isinstance(axis_map, dict):
        parts = [f"{k}: {v}" for k, v in sorted(axis_map.items())]
        return f"({', '.join(parts)})"
    return str(axis_map)


def _annotate_robot_move_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for robot/moveTo, moveAxesTo, moveAxesRelative."""
    command_type = getattr(command, "commandType", "")
    params = getattr(command, "params", None)
    if params is None:
        return
    if command_type == "robot/moveTo":
        dest = getattr(params, "destination", None) or {}
        mount = getattr(params, "mount", "left")
        mount_str = "left mount" if mount == "left" else "right mount" if mount == "right" else "extension mount"
        x = dest.get("x", 0) if isinstance(dest, dict) else getattr(dest, "x", 0)
        y = dest.get("y", 0) if isinstance(dest, dict) else getattr(dest, "y", 0)
        z = dest.get("z", 0) if isinstance(dest, dict) else getattr(dest, "z", 0)
        command.commandTextKey = "robot_move_to"
        command.commandTextParams = {"mount": mount_str, "x": _format_decimal(x), "y": _format_decimal(y), "z": _format_decimal(z)}
    elif command_type == "robot/moveAxesTo":
        axis_map = getattr(params, "axis_map", None)
        command.commandTextKey = "robot_move_axes_to"
        command.commandTextParams = {"position": _format_axis_map(axis_map)}
    elif command_type == "robot/moveAxesRelative":
        axis_map = getattr(params, "axis_map", None)
        command.commandTextKey = "robot_move_axes_relative"
        command.commandTextParams = {"displacement": _format_axis_map(axis_map)}
    else:
        pass


def _annotate_configure_for_volume_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for configureForVolume."""
    params = getattr(command, "params", None)
    if params is None:
        return
    pipette_id = getattr(params, "pipetteId", "")
    volume = getattr(params, "volume", 0)
    pipette_name = _get_pipette_display_name(pipette_id, state_summary.pipettes)
    command.commandTextKey = "configure_for_volume"
    command.commandTextParams = {"pipette": pipette_name, "volume": _format_decimal(volume)}


def _annotate_prepare_to_aspirate_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for prepareToAspirate."""
    params = getattr(command, "params", None)
    if params is None:
        return
    pipette_id = getattr(params, "pipetteId", "")
    pipette_name = _get_pipette_display_name(pipette_id, state_summary.pipettes)
    command.commandTextKey = "prepare_to_aspirate"
    command.commandTextParams = {"pipette": pipette_name}


# Display string for nozzle layout (template expects {{layout}} as display text).
_NOZZLE_LAYOUT_DISPLAY_BY_STYLE: Dict[str, str] = {
    "SINGLE": "single nozzle layout",
    "COLUMN": "column layout",
    "ROW": "row layout",
    "QUADRANT": "partial layout",
    "ALL": "all nozzles",
    "PARTIAL": "partial nozzles",
}


def _annotate_configure_nozzle_layout_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for configureNozzleLayout."""
    params = getattr(command, "params", None)
    if params is None:
        return
    pipette_id = getattr(params, "pipetteId", "")
    config_params = getattr(params, "configurationParams", None) or {}
    style = config_params.get("style", "SINGLE") if isinstance(config_params, dict) else getattr(config_params, "style", "SINGLE")
    layout_display = _NOZZLE_LAYOUT_DISPLAY_BY_STYLE.get(str(style), "single nozzle layout")
    pipette_name = _get_pipette_display_name(pipette_id, state_summary.pipettes)
    command.commandTextKey = "configure_nozzle_layout"
    command.commandTextParams = {"layout": layout_display, "pipette": pipette_name}


def _annotate_liquid_probe_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for liquidProbe / tryLiquidProbe."""
    params = getattr(command, "params", None)
    if params is None:
        return
    labware_id = getattr(params, "labwareId", "") or ""
    well_name = getattr(params, "wellName", "") or ""
    labware_name = _get_labware_display_name(labware_id, state_summary.labware)
    labware_location = ""
    for lw in state_summary.labware:
        if lw.id == labware_id:
            labware_location = _get_labware_location_display_string(
                lw.location, state_summary.modules, state_summary.labware
            )
            break
    command.commandTextKey = "detect_liquid_presence"
    command.commandTextParams = {"well_name": well_name, "labware": labware_name, "labware_location": labware_location}


def _annotate_set_tip_state_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for setTipState."""
    params = getattr(command, "params", None)
    if params is None:
        return
    labware_id = getattr(params, "labwareId", "") or ""
    tip_well_state = getattr(params, "tipWellState", "") or ""
    labware_name = _get_labware_display_name(labware_id, state_summary.labware)
    command.commandTextKey = "set_tip_state"
    command.commandTextParams = {"labware": labware_name, "tip_well_state": str(tip_well_state)}


def _annotate_heater_shaker_shake_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for setAndWaitForShakeSpeed / setShakeSpeed."""
    params = getattr(command, "params", None)
    if params is None:
        return
    rpm = getattr(params, "rpm", 0)
    command_type = getattr(command, "commandType", "")
    key = "set_and_await_hs_shake" if command_type == "heaterShaker/setAndWaitForShakeSpeed" else "set_hs_shake"
    command.commandTextKey = key
    command.commandTextParams = {"rpm": str(int(rpm))}


def _annotate_absorbance_reader_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for absorbanceReader commands."""
    command_type = getattr(command, "commandType", "")
    if command_type == "absorbanceReader/initialize":
        params = getattr(command, "params", None)
        if params is None:
            return
        wavelengths = getattr(params, "sampleWavelengths", []) or []
        mode = "multiple" if getattr(params, "measureMode", "") == "multi" else "single"
        wave_str = " nm, ".join(str(w) for w in wavelengths) + " nm"
        command.commandTextKey = "absorbance_reader_initialize"
        command.commandTextParams = {"mode": mode, "wavelengths": wave_str}
    else:
        key_by_type = {
            "absorbanceReader/openLid": "absorbance_reader_open_lid",
            "absorbanceReader/closeLid": "absorbance_reader_close_lid",
            "absorbanceReader/read": "absorbance_reader_read",
        }
        key = key_by_type.get(command_type)
        if key:
            command.commandTextKey = key
            command.commandTextParams = None


def _annotate_move_to_well_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for moveToWell."""
    params = getattr(command, "params", None)
    if params is None:
        return
    labware_id = getattr(params, "labwareId", "") or ""
    well_name = getattr(params, "wellName", "") or ""
    well_location = getattr(params, "wellLocation", None)
    offset = getattr(well_location, "offset", None) if well_location else None
    x = _format_decimal(getattr(offset, "x", None) if offset else None)
    y = _format_decimal(getattr(offset, "y", None) if offset else None)
    z = _format_decimal(getattr(offset, "z", None) if offset else None)
    origin = getattr(well_location, "origin", "") if well_location else ""
    labware_name = _get_labware_display_name(labware_id, state_summary.labware)
    labware_location = ""
    for lw in state_summary.labware:
        if lw.id == labware_id:
            labware_location = _get_labware_location_display_string(
                lw.location, state_summary.modules, state_summary.labware
            )
            break
    command.commandTextKey = "move_to_well"
    command.commandTextParams = {
        "wellName": well_name,
        "labware": labware_name,
        "xOffset": x,
        "yOffset": y,
        "zOffset": z,
        "positionRelative": str(origin),
        "displayLocation": labware_location,
    }


def _annotate_move_to_addressable_area_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for moveToAddressableArea / moveToAddressableAreaForDropTip."""
    params = getattr(command, "params", None)
    if params is None:
        return
    area = getattr(params, "addressableAreaName", "") or ""
    command_type = getattr(command, "commandType", "")
    key = "move_to_addressable_area_drop_tip" if command_type == "moveToAddressableAreaForDropTip" else "move_to_addressable_area"
    command.commandTextKey = key
    command.commandTextParams = {"addressable_area": area}


def _annotate_move_labware_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for moveLabware."""
    params = getattr(command, "params", None)
    if params is None:
        return
    labware_id = getattr(params, "labwareId", "") or ""
    strategy = getattr(params, "strategy", "") or ""
    labware_name = _get_labware_display_name(labware_id, state_summary.labware)
    result = getattr(command, "result", None)
    old_loc = ""
    new_loc = ""
    if result:
        orig_seq = getattr(result, "originLocationSequence", None)
        dest_seq = getattr(result, "immediateDestinationLocationSequence", None)
        if orig_seq is not None and dest_seq is not None:
            old_loc = str(orig_seq)
            new_loc = str(dest_seq)
    if not old_loc and not new_loc:
        new_location = getattr(params, "newLocation", None)
        old_loc = "?"
        new_loc = str(new_location) if new_location else "?"
    key = "move_labware_using_gripper" if strategy == "usingGripper" else "move_labware_manually"
    command.commandTextKey = key
    command.commandTextParams = {"labware": labware_name, "old_location": old_loc, "new_location": new_loc}


def _annotate_load_command(
    command: Command, state_summary: StateSummary
) -> None:
    """Set commandTextKey and commandTextParams for loadLabware, loadModule, loadPipette, etc."""
    command_type = getattr(command, "commandType", "")
    params = getattr(command, "params", None)
    result = getattr(command, "result", None)
    if command_type == "loadPipette":
        mount = getattr(params, "mount", "left")
        mount_name = "Left" if mount == "left" else "Right"
        pipette_name = _get_pipette_display_name(getattr(params, "pipetteId", ""), state_summary.pipettes) or ""
        command.commandTextKey = "load_pipette_protocol_setup"
        command.commandTextParams = {"pipette_name": pipette_name, "mount_name": mount_name}
    elif command_type == "loadModule":
        model = getattr(params, "model", "") or ""
        location = getattr(params, "location", None)
        slot_name = str(getattr(location, "slotName", "")) if location else "?"
        command.commandTextKey = "load_module_protocol_setup"
        command.commandTextParams = {"module": model, "slot_name": slot_name}
    elif command_type in ("loadLabware", "reloadLabware"):
        display_name = ""
        if params and hasattr(params, "displayName") and getattr(params, "displayName"):
            display_name = str(getattr(params, "displayName"))
        elif result and hasattr(result, "definition"):
            defn = getattr(result, "definition", None)
            if defn and hasattr(defn, "metadata"):
                display_name = str(getattr(defn.metadata, "displayName", ""))
        loc = getattr(result, "locationSequence", None) or getattr(params, "location", None) if (result or params) else None
        display_location = str(loc) if loc else "?"
        command.commandTextKey = "load_labware_to_display_location"
        command.commandTextParams = {"labware": display_name or "Labware", "display_location": display_location}
    elif command_type == "loadLidStack":
        if result and getattr(result, "definition", None) is None:
            command.commandTextKey = "load_lid_stack_empty"
            command.commandTextParams = None
        else:
            quantity = getattr(params, "quantity", 0) if params else 0
            lid_name = ""
            if result and hasattr(result, "definition"):
                defn = getattr(result, "definition", None)
                if defn and hasattr(defn, "metadata"):
                    lid_name = str(getattr(defn.metadata, "displayName", ""))
            command.commandTextKey = "load_lid_stack"
            command.commandTextParams = {"quantity": str(quantity), "labware": lid_name or "Lid", "display_location": "?"}
    elif command_type == "loadLiquid":
        liquid_id = getattr(params, "liquidId", "") if params else ""
        labware_id = getattr(params, "labwareId", "") if params else ""
        labware_name = _get_labware_display_name(labware_id, state_summary.labware)
        command.commandTextKey = "load_liquids_info_protocol_setup"
        command.commandTextParams = {"liquid": liquid_id, "labware": labware_name}
    elif command_type == "loadLiquidClass":
        liquid_class = getattr(params, "liquidClassId", "") if params else ""
        command.commandTextKey = "load_liquid_class"
        command.commandTextParams = {"liquidClassDisplayName": liquid_class}
    else:
        pass


def _annotate_tc_run_profile_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for thermocycler/runProfile."""
    params = getattr(command, "params", None)
    if params is None:
        return
    steps = getattr(params, "steps", []) or []
    command.commandTextKey = "tc_starting_profile"
    command.commandTextParams = {"stepCount": str(len(steps))}


def _annotate_tc_extended_profile_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for thermocycler runExtendedProfile/startRunExtendedProfile."""
    params = getattr(command, "params", None)
    if params is None:
        return
    profile = getattr(params, "profile", None)
    if profile is None:
        command.commandTextKey = "tc_starting_extended_profile"
        command.commandTextParams = {"elementCount": "0"}
        return
    steps = getattr(profile, "steps", []) or []
    cycles = getattr(profile, "cycles", []) or []
    total = len(steps) + sum(len(getattr(c, "steps", [])) * max(getattr(c, "repetitions", 1), 1) for c in cycles)
    key = "tc_starting_extended_profile_in_background" if getattr(command, "commandType", "") == "thermocycler/startRunExtendedProfile" else "tc_starting_extended_profile"
    command.commandTextKey = key
    command.commandTextParams = {"elementCount": str(total)}


def _annotate_capture_image_command(command: Command) -> None:
    """Set commandTextKey and commandTextParams for captureImage."""
    params = getattr(command, "params", None)
    if params is None:
        command.commandTextKey = "capture_image_simple"
        command.commandTextParams = None
        return
    # Simplified: use simple key if no notable options
    command.commandTextKey = "capture_image_simple"
    command.commandTextParams = None


def annotate_commands_with_command_text(
    commands: List[Command],
    state_summary: StateSummary,
    robot_type: RobotType,
) -> None:
    """Annotate each command with commandTextKey and commandTextParams in place.

    Keys and param names match protocol_command_text.json so consumers can
    call t(key, params) or interpolate with the same templates.

    Args:
        commands: Protocol engine commands (mutated in place).
        state_summary: Run state (labware, pipettes, modules, liquids).
        robot_type: Robot type (for future use, e.g. Flex vs OT-2 display).
    """
    _ = robot_type  # Reserved for robot-specific display (e.g. slot naming).
    for command in commands:
        command_type: str = getattr(command, "commandType", "") or ""

        if command_type in _DIRECT_TRANSLATION_KEY_BY_COMMAND_TYPE:
            command.commandTextKey = _DIRECT_TRANSLATION_KEY_BY_COMMAND_TYPE[
                command_type
            ]
            command.commandTextParams = None
            continue

        if command_type in (
            "aspirate",
            "aspirateInPlace",
            "aspirateWhileTracking",
            "dispense",
            "dispenseInPlace",
            "dispenseWhileTracking",
            "blowout",
            "blowOutInPlace",
            "pickUpTip",
            "dropTip",
            "dropTipInPlace",
            "airGapInPlace",
            "sealPipetteToTip",
            "unsealPipetteFromTip",
            "pressureDispense",
        ):
            _annotate_pipetting_command(command, state_summary)
            continue

        if command_type == "comment":
            _annotate_comment_command(command)
            continue

        if command_type == "waitForDuration":
            _annotate_wait_for_duration_command(command)
            continue

        if command_type in (
            "temperatureModule/setTargetTemperature",
            "temperatureModule/waitForTemperature",
            "thermocycler/setTargetBlockTemperature",
            "thermocycler/setTargetLidTemperature",
            "heaterShaker/setTargetTemperature",
        ):
            _annotate_temperature_command(command)
            continue

        if command_type == "moveRelative":
            _annotate_move_relative_command(command)
            continue
        if command_type == "moveToSlot":
            _annotate_move_to_slot_command(command)
            continue
        if command_type == "moveToCoordinates":
            _annotate_move_to_coordinates_command(command)
            continue

        if command_type == "setRailLights":
            _annotate_set_rail_lights_command(command)
            continue

        if command_type == "delay":
            _annotate_delay_command(command)
            continue

        if command_type == "custom":
            _annotate_custom_command(command)
            continue

        if command_type == "createTimer":
            _annotate_create_timer_command(command)
            continue

        if command_type in ("robot/moveTo", "robot/moveAxesTo", "robot/moveAxesRelative"):
            _annotate_robot_move_command(command)
            continue

        if command_type == "configureForVolume":
            _annotate_configure_for_volume_command(command, state_summary)
            continue
        if command_type == "prepareToAspirate":
            _annotate_prepare_to_aspirate_command(command, state_summary)
            continue
        if command_type == "configureNozzleLayout":
            _annotate_configure_nozzle_layout_command(command, state_summary)
            continue

        if command_type in ("liquidProbe", "tryLiquidProbe"):
            _annotate_liquid_probe_command(command, state_summary)
            continue

        if command_type == "setTipState":
            _annotate_set_tip_state_command(command, state_summary)
            continue

        if command_type in ("heaterShaker/setAndWaitForShakeSpeed", "heaterShaker/setShakeSpeed"):
            _annotate_heater_shaker_shake_command(command)
            continue

        if command_type in (
            "absorbanceReader/openLid",
            "absorbanceReader/closeLid",
            "absorbanceReader/initialize",
            "absorbanceReader/read",
        ):
            _annotate_absorbance_reader_command(command)
            continue

        if command_type == "moveToWell":
            _annotate_move_to_well_command(command, state_summary)
            continue
        if command_type in ("moveToAddressableArea", "moveToAddressableAreaForDropTip"):
            _annotate_move_to_addressable_area_command(command)
            continue
        if command_type == "moveLabware":
            _annotate_move_labware_command(command, state_summary)
            continue

        if command_type in (
            "loadLabware",
            "reloadLabware",
            "loadLid",
            "loadLidStack",
            "loadPipette",
            "loadModule",
            "loadLiquid",
            "loadLiquidClass",
        ):
            _annotate_load_command(command, state_summary)
            continue

        if command_type == "captureImage":
            _annotate_capture_image_command(command)
            continue

        if command_type == "thermocycler/runProfile":
            _annotate_tc_run_profile_command(command)
            continue
        if command_type in ("thermocycler/runExtendedProfile", "thermocycler/startRunExtendedProfile"):
            _annotate_tc_extended_profile_command(command)
            continue

        # Unknown or not yet implemented: leave commandTextKey/Params unset
        # so consumers can fall back to existing getters or generic text.
