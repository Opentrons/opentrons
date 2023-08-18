"""Tests for the opentrons.protocols.geometry.Deck interface."""
from typing import Any

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.motion_planning import deck_conflict
from opentrons.protocols.api_support.deck_type import (
    SHORT_TRASH_DECK,
    STANDARD_OT2_DECK,
)
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.core.legacy.legacy_labware_core import LegacyLabwareCore
from opentrons.protocol_api.core.legacy.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)
from opentrons.protocol_api.core.legacy.deck import Deck

from opentrons.types import DeckSlotName


@pytest.fixture(autouse=True)
def use_mock_deck_conflict_check(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out the deck conflict checker."""
    mock_check = decoy.mock(func=deck_conflict.check)
    monkeypatch.setattr(deck_conflict, "check", mock_check)


# We expect the subject to call the deck conflict checker with a fixed trash argument
# that matches this.
EXPECTED_FIXED_TRASH = deck_conflict.Labware(
    uri=matchers.Anything(),
    highest_z=matchers.Anything(),
    is_fixed_trash=True,
    name_for_errors=matchers.Anything(),
)


# This Deck class is only used by Python Protocol API versions earlier than 2.13,
# which only support the OT-2, not the OT-3.
@pytest.fixture(params=[STANDARD_OT2_DECK, SHORT_TRASH_DECK])
def subject(request: Any) -> Deck:
    """Get a Deck test subject."""
    return Deck(deck_type=request.param)


@pytest.mark.parametrize("slot_number", range(1, 12))
def test_slot_names(decoy: Decoy, slot_number: int, subject: Deck) -> None:
    """Ensure item get/set/delete works with both strs and ints."""
    deck_item = decoy.mock(cls=LegacyLabwareCore)
    decoy.when(deck_item.get_quirks()).then_return([])
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
    """It should reject things that aren't slot names."""
    with pytest.raises(ValueError, match="Unknown slot"):
        subject[bad_slot]

    with pytest.raises(ValueError, match="Unknown slot"):
        subject[bad_slot] = decoy.mock(cls=LegacyLabwareCore)


def test_highest_z(decoy: Decoy, subject: Deck) -> None:
    """It should return the highest Z point of all objects on the deck."""
    item_10 = decoy.mock(cls=LegacyLabwareCore)
    decoy.when(item_10.get_quirks()).then_return([])
    decoy.when(item_10.highest_z).then_return(10)

    item_100 = decoy.mock(cls=LegacyLabwareCore)
    decoy.when(item_100.get_quirks()).then_return([])
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


def test_fixed_trash_conflict_checking(decoy: Decoy) -> None:
    """It should correctly call the deck conflict checker with fixed trash labware."""
    subject = Deck(deck_type=STANDARD_OT2_DECK)
    decoy.verify(
        deck_conflict.check(
            existing_items={},
            new_location=DeckSlotName.FIXED_TRASH,
            new_item=EXPECTED_FIXED_TRASH,
            robot_type="OT-2 Standard",
        )
    )

    # Load another trash as an opentrons.protocol_api.Labware and test that the subject
    # correctly calls the deck conflict checker with that, too.
    # This intended to mimic what happens when we run a JSON protocol of v5 or below.
    # A trash labware is added to the subject that overrides the one that it loaded
    # upon construction.
    another_trash = decoy.mock(cls=Labware)
    decoy.when(another_trash.highest_z).then_return(42)
    decoy.when(another_trash.load_name).then_return("trash_load_name")
    decoy.when(another_trash.quirks).then_return(["fixedTrash"])
    decoy.when(another_trash.uri).then_return("test/trash/1")
    subject["12"] = another_trash
    decoy.verify(
        deck_conflict.check(
            existing_items={DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH},
            new_location=DeckSlotName.FIXED_TRASH,
            new_item=deck_conflict.Labware(
                uri=LabwareUri("test/trash/1"),
                highest_z=42,
                is_fixed_trash=True,
                name_for_errors="trash_load_name",
            ),
            robot_type="OT-2 Standard",
        )
    )


def test_labware_conflict_checking(
    decoy: Decoy,
    subject: Deck,
) -> None:
    """It should correctly call the deck conflict checker when given a labware."""
    # When given an internal LegacyLabwareCore object:

    input_legacy_labware_core = decoy.mock(cls=LegacyLabwareCore)
    decoy.when(input_legacy_labware_core.highest_z).then_return(42)
    decoy.when(input_legacy_labware_core.load_name).then_return(
        "legacy_labware_core_load_name"
    )
    decoy.when(input_legacy_labware_core.get_quirks()).then_return([])
    decoy.when(input_legacy_labware_core.get_uri()).then_return(
        "legacy_labware_core_uri"
    )

    subject["4"] = input_legacy_labware_core

    decoy.verify(
        deck_conflict.check(
            existing_items={
                DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH,
            },
            new_location=DeckSlotName.SLOT_4,
            new_item=deck_conflict.Labware(
                uri=LabwareUri("legacy_labware_core_uri"),
                highest_z=42,
                is_fixed_trash=False,
                name_for_errors="legacy_labware_core_load_name",
            ),
            robot_type="OT-2 Standard",
        ),
        times=1,
    )

    del subject["4"]

    # When given a public-facing Labware object:

    input_labware = decoy.mock(cls=Labware)
    decoy.when(input_labware.highest_z).then_return(42)
    decoy.when(input_labware.load_name).then_return("labware_load_name")
    decoy.when(input_labware.quirks).then_return([])
    decoy.when(input_labware.uri).then_return("labware_uri")

    subject["4"] = input_labware

    decoy.verify(
        deck_conflict.check(
            existing_items={
                DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH,
            },
            new_location=DeckSlotName.SLOT_4,
            new_item=deck_conflict.Labware(
                uri=LabwareUri("labware_uri"),
                highest_z=42,
                is_fixed_trash=False,
                name_for_errors="labware_load_name",
            ),
            robot_type="OT-2 Standard",
        ),
        times=1,
    )


@pytest.mark.parametrize("is_semi_configuration", [True, False])
def test_thermocycler_module_conflict_checking(
    decoy: Decoy,
    subject: Deck,
    is_semi_configuration: bool,
) -> None:
    """It should correctly call the deck conflict checker when given a Thermocycler."""
    input_thermocycler = decoy.mock(cls=ThermocyclerGeometry)
    decoy.when(input_thermocycler.highest_z).then_return(42)
    decoy.when(input_thermocycler.load_name).then_return("thermocycler_load_name")
    decoy.when(input_thermocycler.is_semi_configuration).then_return(
        is_semi_configuration
    )

    subject["4"] = input_thermocycler

    decoy.verify(
        deck_conflict.check(
            existing_items={
                DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH,
            },
            new_location=DeckSlotName.SLOT_4,
            new_item=deck_conflict.ThermocyclerModule(
                highest_z_including_labware=42,
                name_for_errors="thermocycler_load_name",
                is_semi_configuration=is_semi_configuration,
            ),
            robot_type="OT-2 Standard",
        ),
        times=1,
    )


def test_heater_shaker_module_conflict_checking(
    decoy: Decoy,
    subject: Deck,
) -> None:
    """It should correctly call the deck conflict checker when given a Heater-Shaker."""
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    decoy.when(heater_shaker.highest_z).then_return(42)
    decoy.when(heater_shaker.load_name).then_return("heater_shaker_load_name")

    subject["4"] = heater_shaker

    decoy.verify(
        deck_conflict.check(
            existing_items={
                DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH,
            },
            new_location=DeckSlotName.SLOT_4,
            new_item=deck_conflict.HeaterShakerModule(
                highest_z_including_labware=42,
                name_for_errors="heater_shaker_load_name",
            ),
            robot_type="OT-2 Standard",
        ),
        times=1,
    )


def test_other_module_conflict_checking(
    decoy: Decoy,
    subject: Deck,
) -> None:
    """It should correctly call the deck conflict checker when given a module."""
    heater_shaker = decoy.mock(cls=ModuleGeometry)
    decoy.when(heater_shaker.highest_z).then_return(42)
    decoy.when(heater_shaker.load_name).then_return("module_load_name")

    subject["4"] = heater_shaker

    decoy.verify(
        deck_conflict.check(
            existing_items={
                DeckSlotName.FIXED_TRASH: EXPECTED_FIXED_TRASH,
            },
            new_location=DeckSlotName.SLOT_4,
            new_item=deck_conflict.OtherModule(
                highest_z_including_labware=42,
                name_for_errors="module_load_name",
            ),
            robot_type="OT-2 Standard",
        ),
        times=1,
    )
