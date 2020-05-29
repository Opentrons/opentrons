""" Utility functions and classes for the hardware controller"""
import asyncio
import logging
from typing import Dict, Any, Optional, List, Tuple

from .types import CriticalPoint
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
