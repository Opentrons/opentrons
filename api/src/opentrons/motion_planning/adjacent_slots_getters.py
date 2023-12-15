"""Getters for specific adjacent slots."""

from typing import Optional, List

from opentrons.types import StagingSlotName


def get_north_slot(slot: int) -> Optional[int]:
    """Get slot north of the given slot."""
    if slot in [10, 11, 12]:
        return None
    else:
        return slot + 3


def get_south_slot(slot: int) -> Optional[int]:
    """Get slot south of the given slot."""
    if slot in [1, 2, 3]:
        return None
    else:
        return slot - 3


def get_east_slot(slot: int) -> Optional[int]:
    """Get slot east of the given slot."""
    if slot in [3, 6, 9, 12]:
        return None
    else:
        return slot + 1


def get_west_slot(slot: int) -> Optional[int]:
    """Get slot west of the given slot."""
    if slot in [1, 4, 7, 10]:
        return None
    else:
        return slot - 1


_WEST_OF_STAGING_SLOT_MAP = {
    StagingSlotName.SLOT_A4: "A3",
    StagingSlotName.SLOT_B4: "B3",
    StagingSlotName.SLOT_C4: "C3",
    StagingSlotName.SLOT_D4: "D3",
}


def get_west_of_staging_slot(staging_slot: StagingSlotName) -> str:
    """Get slot west of a staging slot."""
    return _WEST_OF_STAGING_SLOT_MAP[staging_slot]


def get_east_west_slots(slot: int) -> List[int]:
    """Get slots east & west of the given slot."""
    east = get_east_slot(slot)
    west = get_west_slot(slot)
    return [maybe_slot for maybe_slot in [east, west] if maybe_slot is not None]


def get_north_south_slots(slot: int) -> List[int]:
    """Get slots north & south of the given slot."""
    north = get_north_slot(slot)
    south = get_south_slot(slot)
    return [maybe_slot for maybe_slot in [north, south] if maybe_slot is not None]


def get_adjacent_slots(slot: int) -> List[int]:
    """Get slots on the east, west, north and south of the given slot."""
    return get_east_west_slots(slot) + get_north_south_slots(slot)
