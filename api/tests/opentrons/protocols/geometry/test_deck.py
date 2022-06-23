"""Tests for the opentrons.protocols.geometry.Deck interface."""
from typing import Any

import pytest
from decoy import Decoy

from opentrons.hardware_control.modules import ModuleType
from opentrons.protocols.geometry import deck_conflict
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.module_geometry import ModuleGeometry


@pytest.fixture(autouse=True)
def mock_deck_conflict_check(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out the deck conflict checker."""
    mock_check = decoy.mock(func=deck_conflict.check)
    monkeypatch.setattr(deck_conflict, "check", mock_check)


@pytest.fixture
def subject() -> Deck:
    """Get a Deck test subject."""
    return Deck()


@pytest.mark.parametrize("slot_number", range(1, 12))
def test_slot_names(decoy: Decoy, slot_number: int, subject: Deck) -> None:
    """Ensure item get/set/delete works with both strs and ints."""
    deck_item = decoy.mock(cls=DeckItem)
    decoy.when(deck_item.highest_z).then_return(42)

    slot_name = str(slot_number)

    subject[slot_number] = deck_item
    assert subject[slot_number] is deck_item
    assert subject[slot_name] is deck_item

    del subject[slot_number]
    assert subject[slot_number] is None
    assert subject[slot_name] is None

    subject[slot_name] = deck_item
    assert subject[slot_number] is deck_item
    assert subject[slot_name] is deck_item

    del subject[slot_name]
    assert subject[slot_number] is None
    assert subject[slot_name] is None


@pytest.mark.parametrize("bad_slot", [0, 13, 1.0, "0", "13", "1.0", "hello world"])
def test_invalid_slot_names(decoy: Decoy, bad_slot: Any, subject: Deck) -> None:
    with pytest.raises(ValueError, match="Unknown slot"):
        subject[bad_slot]

    with pytest.raises(ValueError, match="Unknown slot"):
        subject[bad_slot] = decoy.mock(cls=DeckItem)


def test_highest_z(decoy: Decoy, subject: Deck) -> None:
    item_10 = decoy.mock(cls=DeckItem)
    decoy.when(item_10.highest_z).then_return(10)

    item_100 = decoy.mock(cls=DeckItem)
    decoy.when(item_100.highest_z).then_return(100)

    del subject[12]
    assert subject.highest_z == 0

    subject[1] = item_10
    assert subject.highest_z == 10

    subject[2] = item_100
    assert subject.highest_z == 100

    decoy.when(item_100.highest_z).then_return(50)
    subject.recalculate_high_z()
    assert subject.highest_z == 50

    del subject[1]
    assert subject.highest_z == 50

    del subject[2]
    assert subject.highest_z == 0


def test_item_collisions(
    decoy: Decoy,
    subject: Deck,
) -> None:
    labware_item = decoy.mock(cls=DeckItem)
    decoy.when(labware_item.highest_z).then_return(42)

    module_item = decoy.mock(cls=ModuleGeometry)
    decoy.when(module_item.module_type).then_return(ModuleType.THERMOCYCLER)
    decoy.when(module_item.highest_z).then_return(42)

    subject["4"] = labware_item
    decoy.verify(
        deck_conflict.check(
            existing_items={12: subject.get_fixed_trash()},  # type: ignore[dict-item]
            new_location=4,
            new_item=labware_item,
        ),
        times=1,
    )
    assert subject[4] == labware_item

    decoy.when(
        deck_conflict.check(
            existing_items={4: labware_item, 12: subject.get_fixed_trash()},  # type: ignore[dict-item]
            new_location=7,
            new_item=module_item,
        )
    ).then_raise(deck_conflict.DeckConflictError("oh no"))

    with pytest.raises(deck_conflict.DeckConflictError, match="oh no"):
        subject[7] = module_item

    assert subject[7] is None
