"""Getters for specific adjacent slots."""

from typing import Optional, List


def _get_north_slot(location: int) -> Optional[int]:
    if location in [10, 11, 12]:
        return None
    else:
        return location + 3


def get_south_slot(location: int) -> Optional[int]:
    if location in [1, 2, 3]:
        return None
    else:
        return location - 3


def _get_east_slot(location: int) -> Optional[int]:
    if location in [3, 6, 9, 12]:
        return None
    else:
        return location + 1


def _get_west_slot(location: int) -> Optional[int]:
    if location in [1, 4, 7, 10]:
        return None
    else:
        return location - 1


def get_east_west_slots(location: int) -> List[int]:
    east = _get_east_slot(location)
    west = _get_west_slot(location)
    return [maybe_loc for maybe_loc in [east, west] if maybe_loc is not None]


def get_north_south_slots(location: int) -> List[int]:
    north = _get_north_slot(location)
    south = get_south_slot(location)
    return [maybe_loc for maybe_loc in [north, south] if maybe_loc is not None]


def get_adjacent_slots(location: int) -> List[int]:
    return get_east_west_slots(location) + get_north_south_slots(location)
