"""Tests for adjacent_slots_getters."""
import pytest
from typing import List

from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_north_south_slots,
    get_adjacent_slots,
)


@pytest.mark.parametrize(
    argnames=["slot", "expected_east_west"],
    argvalues=[
        [1, [2]],
        [2, [1, 3]],
        [3, [2]],
        [4, [5]],
        [5, [4, 6]],
        [6, [5]],
        [7, [8]],
        [8, [7, 9]],
        [9, [8]],
        [10, [11]],
        [11, [10, 12]],
        [12, [11]],
    ],
)
def test_get_east_west_slots(slot: int, expected_east_west: List[int]) -> None:
    """It should return a list of slots on the east & west."""
    assert sorted(get_east_west_slots(slot)) == sorted(expected_east_west)


@pytest.mark.parametrize(
    argnames=["slot", "expected_north_south"],
    argvalues=[
        [1, [4]],
        [2, [5]],
        [3, [6]],
        [4, [7, 1]],
        [5, [2, 8]],
        [6, [9, 3]],
        [7, [10, 4]],
        [8, [11, 5]],
        [9, [12, 6]],
        [10, [7]],
        [11, [8]],
        [12, [9]],
    ],
)
def test_get_north_south_slots(slot: int, expected_north_south: List[int]) -> None:
    """It should return a list of slots in the north & south."""
    assert sorted(get_north_south_slots(slot)) == sorted(expected_north_south)


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
