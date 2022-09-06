"""Tests for Protocol API input validation."""
from typing import List, Union

import pytest

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import Mount, DeckSlotName
from opentrons.protocol_api import validation as subject


@pytest.mark.parametrize(
    ["input_value", "expected"],
    [
        ("left", Mount.LEFT),
        ("right", Mount.RIGHT),
        ("LeFt", Mount.LEFT),
        (Mount.LEFT, Mount.LEFT),
        (Mount.RIGHT, Mount.RIGHT),
    ],
)
def test_ensure_mount(input_value: Union[str, Mount], expected: Mount) -> None:
    """It should properly map strings and mounts."""
    result = subject.ensure_mount(input_value)
    assert result == expected


def test_ensure_mount_input_invalid() -> None:
    """It should raise if given invalid mount input."""
    with pytest.raises(ValueError, match="must be 'left' or 'right'"):
        subject.ensure_mount("oh no")

    with pytest.raises(TypeError, match="'left', 'right', or an opentrons.types.Mount"):
        subject.ensure_mount(42)  # type: ignore[arg-type]


def test_ensure_pipette_name() -> None:
    """It should properly map strings and PipetteNameType enums."""
    result = subject.ensure_pipette_name("p300_single")
    assert result == PipetteNameType.P300_SINGLE


def test_ensure_pipette_input_invalid() -> None:
    """It should raise a ValueError if given an invalid name."""
    with pytest.raises(ValueError, match="must be given valid pipette name"):
        subject.ensure_pipette_name("oh-no")


@pytest.mark.parametrize(
    ["input_value", "expected"],
    [
        ("1", DeckSlotName.SLOT_1),
        (1, DeckSlotName.SLOT_1),
        (12, DeckSlotName.FIXED_TRASH),
        ("12", DeckSlotName.FIXED_TRASH),
    ],
)
def test_ensure_deck_slot(input_value: Union[str, int], expected: DeckSlotName) -> None:
    """It should map strings and ints to DeckSlotName values."""
    result = subject.ensure_deck_slot(input_value)
    assert result == expected


def test_ensure_deck_slot_invalid() -> None:
    """It should raise a ValueError if given an invalid name."""
    input_values: List[Union[str, int]] = ["0", 0, "13", 13]

    for input_value in input_values:
        with pytest.raises(ValueError, match="not a valid deck slot"):
            subject.ensure_deck_slot(input_value)

    with pytest.raises(TypeError, match="must be a string or integer"):
        subject.ensure_deck_slot(1.23)  # type: ignore[arg-type]
