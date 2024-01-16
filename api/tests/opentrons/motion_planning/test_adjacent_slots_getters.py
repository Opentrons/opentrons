"""Tests for adjacent_slots_getters."""
import pytest
from typing import List, Optional

from opentrons.types import DeckSlotName, StagingSlotName
from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_slot,
    get_south_slot,
    get_west_slot,
    get_north_slot,
    get_east_west_slots,
    get_north_south_slots,
    get_adjacent_slots,
    get_west_of_staging_slot,
    get_adjacent_staging_slot,
)


@pytest.mark.parametrize(
    argnames=["slot", "expected_east", "expected_west", "expected_both"],
    argvalues=[
        [1, 2, None, [2]],
        [2, 3, 1, [3, 1]],
        [3, None, 2, [2]],
        [4, 5, None, [5]],
        [5, 6, 4, [6, 4]],
        [6, None, 5, [5]],
        [7, 8, None, [8]],
        [8, 9, 7, [9, 7]],
        [9, None, 8, [8]],
        [10, 11, None, [11]],
        [11, 12, 10, [12, 10]],
        [12, None, 11, [11]],
    ],
)
def test_get_east_west_slots(
    slot: int,
    expected_west: Optional[int],
    expected_east: Optional[int],
    expected_both: List[int],
) -> None:
    """It should return a list of slots on the east & west."""
    assert get_east_slot(slot) == expected_east
    assert get_west_slot(slot) == expected_west
    assert get_east_west_slots(slot) == expected_both


@pytest.mark.parametrize(
    argnames=["slot", "expected_north", "expected_south", "expected_both"],
    argvalues=[
        [1, 4, None, [4]],
        [2, 5, None, [5]],
        [3, 6, None, [6]],
        [4, 7, 1, [7, 1]],
        [5, 8, 2, [8, 2]],
        [6, 9, 3, [9, 3]],
        [7, 10, 4, [10, 4]],
        [8, 11, 5, [11, 5]],
        [9, 12, 6, [12, 6]],
        [10, None, 7, [7]],
        [11, None, 8, [8]],
        [12, None, 9, [9]],
    ],
)
def test_get_north_south_slots(
    slot: int,
    expected_north: Optional[int],
    expected_south: Optional[int],
    expected_both: List[int],
) -> None:
    """It should return a list of slots in the north & south."""
    assert get_north_slot(slot) == expected_north
    assert get_south_slot(slot) == expected_south
    assert get_north_south_slots(slot) == expected_both


@pytest.mark.parametrize(
    argnames=["slot", "expected_adjacent"],
    argvalues=[
        [1, [2, 4]],
        [2, [5, 1, 3]],
        [3, [6, 2]],
        [4, [7, 1, 5]],
        [5, [2, 8, 4, 6]],
        [6, [9, 3, 5]],
        [7, [10, 4, 8]],
        [8, [11, 5, 7, 9]],
        [9, [12, 6, 8]],
        [10, [7, 11]],
        [11, [8, 10, 12]],
        [12, [9, 11]],
    ],
)
def test_get_adjacent_slots(slot: int, expected_adjacent: List[int]) -> None:
    """It should return a list of adjacent slots."""
    assert sorted(get_adjacent_slots(slot)) == sorted(expected_adjacent)


@pytest.mark.parametrize(
    argnames=["slot", "expected_adjacent"],
    argvalues=[
        (StagingSlotName.SLOT_A4, DeckSlotName.SLOT_A3),
        (StagingSlotName.SLOT_B4, DeckSlotName.SLOT_B3),
        (StagingSlotName.SLOT_C4, DeckSlotName.SLOT_C3),
        (StagingSlotName.SLOT_D4, DeckSlotName.SLOT_D3),
    ],
)
def test_get_west_of_staging_slot(
    slot: StagingSlotName, expected_adjacent: DeckSlotName
) -> None:
    """It should find the slot directly west of a staging slot."""
    assert get_west_of_staging_slot(slot) == expected_adjacent


@pytest.mark.parametrize(
    argnames=["slot", "expected_adjacent"],
    argvalues=[
        (DeckSlotName.SLOT_A3, StagingSlotName.SLOT_A4),
        (DeckSlotName.SLOT_B3, StagingSlotName.SLOT_B4),
        (DeckSlotName.SLOT_C3, StagingSlotName.SLOT_C4),
        (DeckSlotName.SLOT_D3, StagingSlotName.SLOT_D4),
        (DeckSlotName.SLOT_D1, None),
        (DeckSlotName.SLOT_1, None),
    ],
)
def test_get_adjacent_staging_slot(
    slot: DeckSlotName, expected_adjacent: Optional[StagingSlotName]
) -> None:
    """It should find the adjacent slot east of a staging slot if it exists."""
    assert get_adjacent_staging_slot(slot) == expected_adjacent
