""" Utility functions and classes for the hardware controller"""
import asyncio
import logging
from enum import Enum
from typing import Dict, Any, Optional, List, Mapping, Tuple

from .types import CriticalPoint, MotionChecks, OutOfBoundsMove, Axis
from opentrons.types import Point

mod_log = logging.getLogger(__name__)


def _handle_loop_exception(loop: asyncio.AbstractEventLoop,
                           context: Dict[str, Any]):
    mod_log.error(f"Caught exception: {context}")


def use_or_initialize_loop(loop: Optional[asyncio.AbstractEventLoop]
                           ) -> asyncio.AbstractEventLoop:
    checked_loop = loop or asyncio.get_event_loop()
    checked_loop.set_exception_handler(_handle_loop_exception)
    return checked_loop


def plan_arc(
        origin_point: Point,
        dest_point: Point,
        z_height: float,
        origin_cp: CriticalPoint = None,
        dest_cp: CriticalPoint = None,
        extra_waypoints: List[Tuple[float, float]] = None)\
        -> List[Tuple[Point, Optional[CriticalPoint]]]:

    assert z_height >= max(origin_point.z, dest_point.z)
    checked_wp = extra_waypoints or []
    return [(origin_point._replace(z=z_height), origin_cp)]\
        + [(Point(x=wp[0], y=wp[1], z=z_height), dest_cp)
           for wp in checked_wp]\
        + [(dest_point._replace(z=z_height), dest_cp),
           (dest_point, dest_cp)]


class DeckTransformState(Enum):
    OK = "OK"
    IDENTITY = "IDENTITY"
    BAD_CALIBRATION = "BAD_CALIBRATION"
    SINGULARITY = "SINGULARITY"

    def __str__(self):
        return self.name


def check_motion_bounds(
        target_smoothie: Mapping[Axis, float],
        target_deck: Mapping[Axis, float],
        bounds: Mapping[Axis, Tuple[float, float]],
        checks: MotionChecks):
    """
    Log or raise an error (depending on checks) if a specified
    target position is outside the acceptable bounds of motion

    Which axes are checked is defined by the elements of
    target_smoothie.

    The target_deck and mapping does not need to be
    entirely filled; it is used only for logging
    """
    bounds_message_format = (
        'Out of bounds move: {axis}=({tsp} motor controller, {tdp} deck) too '
        '{dir} for limit {limsp}')
    for ax in target_smoothie.keys():
        if target_smoothie[ax] < bounds[ax][0]:
            bounds_message = bounds_message_format.format(
                axis=ax,
                tsp=target_smoothie[ax],
                tdp=target_deck.get(ax, 'unknown'),
                dir='low',
                limsp=bounds.get(ax, ('unknown',))[0],
            )
            mod_log.warning(bounds_message)
            if checks.value & MotionChecks.LOW.value:
                raise OutOfBoundsMove(bounds_message)
        elif target_smoothie[ax] > bounds[ax][1]:
            bounds_message = bounds_message_format.format(
                axis=ax,
                tsp=target_smoothie[ax],
                tdp=target_deck.get(ax, 'unknown'),
                dir='high',
                limsp=bounds.get(ax, (None, 'unknown'))[1],
            )
            mod_log.warning(bounds_message)
            if checks.value & MotionChecks.HIGH.value:
                raise OutOfBoundsMove(bounds_message)
