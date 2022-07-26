"""Getters for specific adjacent slots."""

from typing import Optional, List


def _get_north_slot(slot: int) -> Optional[int]:
    if slot in [10, 11, 12]:
        return None
    else:
        return slot + 3


def get_south_slot(slot: int) -> Optional[int]:
    if slot in [1, 2, 3]:
        return None
    else:
        return slot - 3


def _get_east_slot(slot: int) -> Optional[int]:
    if slot in [3, 6, 9, 12]:
        return None
    else:
        return slot + 1


def _get_west_slot(slot: int) -> Optional[int]:
    if slot in [1, 4, 7, 10]:
        return None
    else:
        return slot - 1


def get_east_west_slots(slot: int) -> List[int]:
    east = _get_east_slot(slot)
    west = _get_west_slot(slot)
    return [maybe_slot for maybe_slot in [east, west] if maybe_slot is not None]


def get_north_south_slots(slot: int) -> List[int]:
    north = _get_north_slot(slot)
    south = get_south_slot(slot)
    return [maybe_slot for maybe_slot in [north, south] if maybe_slot is not None]


def get_adjacent_slots(slot: int) -> List[int]:
    return get_east_west_slots(slot) + get_north_south_slots(slot)
