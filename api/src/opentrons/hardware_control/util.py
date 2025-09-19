""" Utility functions and classes for the hardware controller"""
import asyncio
import logging
from enum import Enum
from typing import Dict, Any, Optional, List, Mapping, Tuple, TypeVar, Union

from .types import CriticalPoint, MotionChecks, Axis
from .errors import OutOfBoundsMove
from opentrons_shared_data.errors.exceptions import MissingConfigurationData
from opentrons.types import Point
from opentrons_shared_data.pipette.types import PipetteTipType
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteConfigurations,
    PressFitPickUpTipConfiguration,
    CamActionPickUpTipConfiguration,
    PressAndCamConfigurationValues,
)

mod_log = logging.getLogger(__name__)


def _handle_loop_exception(
    loop: asyncio.AbstractEventLoop, context: Dict[str, Any]
) -> None:
    mod_log.error(f"Caught exception: {context}")


def use_or_initialize_loop(
    loop: Optional[asyncio.AbstractEventLoop],
) -> asyncio.AbstractEventLoop:
    checked_loop = loop or asyncio.get_event_loop()
    checked_loop.set_exception_handler(_handle_loop_exception)
    return checked_loop


def plan_arc(
    origin_point: Point,
    dest_point: Point,
    z_height: float,
    origin_cp: Optional[CriticalPoint] = None,
    dest_cp: Optional[CriticalPoint] = None,
    extra_waypoints: Optional[List[Tuple[float, float]]] = None,
) -> List[Tuple[Point, Optional[CriticalPoint]]]:

    assert z_height >= max(origin_point.z, dest_point.z)
    checked_wp = extra_waypoints or []
    return (
        [(origin_point._replace(z=z_height), origin_cp)]
        + [(Point(x=wp[0], y=wp[1], z=z_height), dest_cp) for wp in checked_wp]
        + [(dest_point._replace(z=z_height), dest_cp), (dest_point, dest_cp)]
    )


class DeckTransformState(Enum):
    OK = "OK"
    IDENTITY = "IDENTITY"
    BAD_CALIBRATION = "BAD_CALIBRATION"
    SINGULARITY = "SINGULARITY"

    def __str__(self) -> str:
        return self.name


AxisType = TypeVar("AxisType")


def check_motion_bounds(
    target_smoothie: Mapping[AxisType, float],
    target_deck: Mapping[AxisType, float],
    bounds: Mapping[AxisType, Tuple[float, float]],
    checks: MotionChecks,
) -> None:
    """
    Log or raise an error (depending on checks) if a specified
    target position is outside the acceptable bounds of motion

    Which axes are checked is defined by the elements of
    target_smoothie.

    The target_deck and mapping does not need to be
    entirely filled; it is used only for logging
    """
    bounds_message_format = (
        "Out of bounds move: {axis}=({tsp} motor controller, {tdp} deck) too "
        "{dir} for limit {limsp}"
    )
    for ax in target_smoothie.keys():
        if target_smoothie[ax] < bounds[ax][0]:
            format_detail = {
                "axis": ax,
                "tsp": target_smoothie[ax],
                "tdp": target_deck.get(ax, "unknown"),
                "dir": "low",
                "limsp": bounds.get(ax, ("unknown",))[0],
            }
            bounds_message = bounds_message_format.format(**format_detail)
            mod_log.warning(bounds_message)
            if checks.value & MotionChecks.LOW.value:
                raise OutOfBoundsMove(bounds_message, format_detail)
        elif target_smoothie[ax] > bounds[ax][1]:
            format_detail = {
                "axis": ax,
                "tsp": target_smoothie[ax],
                "tdp": target_deck.get(ax, "unknown"),
                "dir": "high",
                "limsp": bounds.get(ax, (None, "unknown"))[1],
            }
            bounds_message = bounds_message_format.format(**format_detail)
            mod_log.warning(bounds_message)
            if checks.value & MotionChecks.HIGH.value:
                raise OutOfBoundsMove(bounds_message, format_detail)


def ot2_axis_to_string(axis: Axis) -> str:
    """Returns OT-2 specific string for the given axis."""
    axis_str_map = {
        Axis.Z_L: "Z",
        Axis.Z_R: "A",
        Axis.P_L: "B",
        Axis.P_R: "C",
    }
    try:
        return axis_str_map[axis]
    except KeyError:
        return axis.name


def _get_press_and_cam_configuration_values(
    config: Union[CamActionPickUpTipConfiguration, PressFitPickUpTipConfiguration],
    valid_nozzle_map_key: str,
    active_tip_type: PipetteTipType,
) -> PressAndCamConfigurationValues:
    try:
        return config.configuration_by_nozzle_map[valid_nozzle_map_key][
            active_tip_type.name
        ]
    except KeyError:
        default = config.configuration_by_nozzle_map[valid_nozzle_map_key].get(
            "default"
        )
        if default is not None:
            return default
        raise MissingConfigurationData(
            message=f"Default tip type configuration values do not exist for Nozzle Map {valid_nozzle_map_key}."
        )


def pick_up_speed_by_configuration(
    config: Union[CamActionPickUpTipConfiguration, PressFitPickUpTipConfiguration],
    valid_nozzle_map_key: str,
    active_tip_type: PipetteTipType,
) -> float:
    """
    Returns the pick up Speed for a given configuration of a given pipette.

    Parameters:
        config: A PressFitPickUpTipConfiguration or a CamActionPickUpTipConfiguration (96ch Only) containing values for speed.
        valid_nozzle_map_key: The string key representing the current pre-validated map of nozzles the pipette has been configured to use.
        active_tip_type: The PipetteTipType to be attached to the pipette.
    """
    configuration_values = _get_press_and_cam_configuration_values(
        config, valid_nozzle_map_key, active_tip_type
    )
    return configuration_values.speed


def pick_up_distance_by_configuration(
    config: Union[CamActionPickUpTipConfiguration, PressFitPickUpTipConfiguration],
    valid_nozzle_map_key: str,
    active_tip_type: PipetteTipType,
) -> float:
    """
    Returns the pick up Distance for a given configuration of a given pipette.

    Parameters:
        config: A PressFitPickUpTipConfiguration or a CamActionPickUpTipConfiguration (96ch Only) containing values for distance.
        valid_nozzle_map_key: The string key representing the current pre-validated map of nozzles the pipette has been configured to use.
        active_tip_type: The PipetteTipType to be attached to the pipette.
    """
    configuration_values = _get_press_and_cam_configuration_values(
        config, valid_nozzle_map_key, active_tip_type
    )
    return configuration_values.distance


def pick_up_current_by_configuration(
    config: Union[CamActionPickUpTipConfiguration, PressFitPickUpTipConfiguration],
    valid_nozzle_map_key: str,
    active_tip_type: PipetteTipType,
) -> float:
    """
    Returns the pick up Current for a given configuration of a given pipette.

    Parameters:
        config: A PressFitPickUpTipConfiguration or a CamActionPickUpTipConfiguration (96ch Only) containing values for current.
        valid_nozzle_map_key: The string key representing the current pre-validated map of nozzles the pipette has been configured to use.
        active_tip_type: The PipetteTipType to be attached to the pipette.
    """
    configuration_values = _get_press_and_cam_configuration_values(
        config, valid_nozzle_map_key, active_tip_type
    )
    return configuration_values.current


def nominal_tip_overlap_dictionary_by_configuration(
    configurations: PipetteConfigurations,
    valid_nozzle_map_key: str,
    active_tip_type: PipetteTipType,
) -> Dict[str, Dict[str, float]]:
    """
    Returns the pick up speed for a given configuration of a given pipette.

    Parameters:
        configurations: The PipetterConfigurations of the pipette the tips will be attached to.
        valid_nozzle_map_key: The string key representing the current pre-validated map of nozzles the pipette has been configured to use.
        active_tip_type: The PipetteTipType to be attached to the pipette.
    """
    for config in (
        configurations.pick_up_tip_configurations.press_fit,
        configurations.pick_up_tip_configurations.cam_action,
    ):
        if not config:
            continue
        try:
            configuration_values = _get_press_and_cam_configuration_values(
                config, valid_nozzle_map_key, active_tip_type
            )
            return configuration_values.versioned_tip_overlap_dictionary
        except KeyError:
            # No valid key found for the approved nozzle map under this configuration - try the next
            continue
    raise MissingConfigurationData(
        message=f"No valid tip overlap dictionaries identified for map {valid_nozzle_map_key} using tip type {active_tip_type}."
    )
