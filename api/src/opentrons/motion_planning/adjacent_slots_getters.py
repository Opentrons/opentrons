"""Getters for specific adjacent slots."""
from dataclasses import dataclass
from typing import Optional, List, Dict, Union

from opentrons_shared_data.robot.types import RobotType

from opentrons.types import DeckSlotName, StagingSlotName


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


def get_north_west_slot(slot: int) -> Optional[int]:
    """Get the slot that's north-west of the given slot."""
    if slot in [1, 4, 7, 10, 11, 12]:
        return None
    else:
        north_slot = get_north_slot(slot)
        return north_slot - 1 if north_slot else None


def get_north_east_slot(slot: int) -> Optional[int]:
    """Get the slot that's north-east of the given slot."""
    if slot in [3, 6, 9, 10, 11, 12]:
        return None
    else:
        north_slot = get_north_slot(slot)
        return north_slot + 1 if north_slot else None


def get_south_west_slot(slot: int) -> Optional[int]:
    """Get the slot that's south-west of the given slot."""
    if slot in [1, 2, 3, 4, 7, 10]:
        return None
    else:
        south_slot = get_south_slot(slot)
        return south_slot - 1 if south_slot else None


def get_south_east_slot(slot: int) -> Optional[int]:
    """Get the slot that's south-east of the given slot."""
    if slot in [1, 2, 3, 6, 9, 12]:
        return None
    else:
        south_slot = get_south_slot(slot)
        return south_slot + 1 if south_slot else None


@dataclass
class _MixedTypeSlots:
    regular_slots: List[DeckSlotName]
    staging_slots: List[StagingSlotName]


def get_surrounding_slots(slot: int, robot_type: RobotType) -> _MixedTypeSlots:
    """Get all the surrounding slots, i.e., adjacent slots as well as corner slots."""
    corner_slots: List[Union[int, None]] = [
        get_north_east_slot(slot),
        get_north_west_slot(slot),
        get_south_east_slot(slot),
        get_south_west_slot(slot),
    ]

    surrounding_regular_slots_int = get_adjacent_slots(slot) + [
        maybe_slot for maybe_slot in corner_slots if maybe_slot is not None
    ]
    surrounding_regular_slots = [
        DeckSlotName.from_primitive(slot_int).to_equivalent_for_robot_type(robot_type)
        for slot_int in surrounding_regular_slots_int
    ]
    surrounding_staging_slots = _SURROUNDING_STAGING_SLOTS_MAP.get(
        DeckSlotName.from_primitive(slot).to_equivalent_for_robot_type(robot_type), []
    )
    return _MixedTypeSlots(
        regular_slots=surrounding_regular_slots, staging_slots=surrounding_staging_slots
    )


_WEST_OF_STAGING_SLOT_MAP: Dict[StagingSlotName, DeckSlotName] = {
    StagingSlotName.SLOT_A4: DeckSlotName.SLOT_A3,
    StagingSlotName.SLOT_B4: DeckSlotName.SLOT_B3,
    StagingSlotName.SLOT_C4: DeckSlotName.SLOT_C3,
    StagingSlotName.SLOT_D4: DeckSlotName.SLOT_D3,
}

_EAST_OF_FLEX_COLUMN_3_MAP: Dict[DeckSlotName, StagingSlotName] = {
    deck_slot: staging_slot
    for staging_slot, deck_slot in _WEST_OF_STAGING_SLOT_MAP.items()
}


_SURROUNDING_STAGING_SLOTS_MAP: Dict[DeckSlotName, List[StagingSlotName]] = {
    DeckSlotName.SLOT_D3: [StagingSlotName.SLOT_C4, StagingSlotName.SLOT_D4],
    DeckSlotName.SLOT_C3: [
        StagingSlotName.SLOT_B4,
        StagingSlotName.SLOT_C4,
        StagingSlotName.SLOT_D4,
    ],
    DeckSlotName.SLOT_B3: [
        StagingSlotName.SLOT_A4,
        StagingSlotName.SLOT_B4,
        StagingSlotName.SLOT_C4,
    ],
    DeckSlotName.SLOT_A3: [StagingSlotName.SLOT_A4, StagingSlotName.SLOT_B4],
}


def get_west_of_staging_slot(staging_slot: StagingSlotName) -> DeckSlotName:
    """Get slot west of a staging slot."""
    return _WEST_OF_STAGING_SLOT_MAP[staging_slot]


def get_adjacent_staging_slot(deck_slot: DeckSlotName) -> Optional[StagingSlotName]:
    """Get the adjacent staging slot if the deck slot is in the third column."""
    return _EAST_OF_FLEX_COLUMN_3_MAP.get(deck_slot)


def get_surrounding_staging_slots(deck_slot: DeckSlotName) -> List[StagingSlotName]:
    """Get the staging slots surrounding the given deck slot."""
    return _SURROUNDING_STAGING_SLOTS_MAP.get(deck_slot, [])


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
