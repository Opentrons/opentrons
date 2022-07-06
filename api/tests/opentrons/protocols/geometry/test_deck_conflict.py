"""Tests for opentrons.protocols.geometry.deck_conflict."""
import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.protocol_api.labware import Labware
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)
from opentrons.protocols.context.labware import AbstractLabware

from opentrons.protocols.geometry.deck_conflict import DeckConflictError, check


def test_empty_no_conflict(decoy: Decoy) -> None:
    """It should not raise on empty input."""
    item = decoy.mock(cls=DeckItem)
    check(existing_items={}, new_item=item, new_location=1)


def test_no_multiple_locations(decoy: Decoy) -> None:
    """It should not allow two items in the same slot."""
    item_1 = decoy.mock(cls=DeckItem)
    item_2 = decoy.mock(cls=DeckItem)

    decoy.when(item_1.load_name).then_return("some_item_1")
    decoy.when(item_2.load_name).then_return("some_item_2")

    with pytest.raises(
        DeckConflictError,
        match="some_item_1 in slot 1 prevents some_item_2 from using slot 1",
    ):
        check(existing_items={1: item_1}, new_item=item_2, new_location=1)


def test_only_trash_in_12(decoy: Decoy) -> None:
    """It should only allow trash labware in slot 12."""
    trash_labware = decoy.mock(cls=Labware)
    trash_labware_impl = decoy.mock(cls=AbstractLabware)
    not_trash = decoy.mock(cls=Labware)
    not_trash_impl = decoy.mock(cls=AbstractLabware)

    decoy.when(trash_labware.quirks).then_return(["fixedTrash"])
    decoy.when(trash_labware_impl.get_quirks()).then_return(["fixedTrash"])
    decoy.when(not_trash.quirks).then_return(["notTrash"])
    decoy.when(not_trash_impl.get_quirks()).then_return(["notTrash"])

    check(existing_items={}, new_item=trash_labware, new_location=12)
    check(existing_items={}, new_item=trash_labware_impl, new_location=12)

    with pytest.raises(
        DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        check(existing_items={}, new_item=not_trash, new_location=12)

    with pytest.raises(
        DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        check(existing_items={}, new_item=not_trash_impl, new_location=12)


def test_trash_override(decoy: Decoy) -> None:
    """It should allow the trash labware to be replaced with another trash labware"""
    trash_labware = decoy.mock(cls=Labware)
    trash_labware_impl = decoy.mock(cls=AbstractLabware)
    not_trash = decoy.mock(cls=Labware)
    not_trash_impl = decoy.mock(cls=AbstractLabware)

    decoy.when(trash_labware.quirks).then_return(["fixedTrash"])
    decoy.when(trash_labware_impl.get_quirks()).then_return(["fixedTrash"])
    decoy.when(not_trash.quirks).then_return(["notTrash"])
    decoy.when(not_trash_impl.get_quirks()).then_return(["notTrash"])

    check(
        existing_items={12: trash_labware},
        new_item=trash_labware_impl,
        new_location=12,
    )

    with pytest.raises(
        DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        check(existing_items={12: trash_labware}, new_item=not_trash, new_location=12)

    with pytest.raises(
        DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        check(
            existing_items={12: trash_labware}, new_item=not_trash_impl, new_location=12
        )


@pytest.mark.parametrize("labware_location", [8, 10, 11])
def test_no_labware_when_thermocycler(decoy: Decoy, labware_location: int) -> None:
    """It should reject labware if a thermocycler is placed."""
    thermocycler = decoy.mock(cls=ThermocyclerGeometry)
    labware = decoy.mock(cls=DeckItem)

    decoy.when(thermocycler.load_name).then_return("some_thermocycler")
    decoy.when(thermocycler.covered_slots).then_return({7, 8, 10, 11})
    decoy.when(labware.load_name).then_return("some_labware")

    with pytest.raises(
        DeckConflictError,
        match=(
            "some_thermocycler in slot 7 prevents"
            f" some_labware from using slot {labware_location}"
        ),
    ):
        check(
            existing_items={7: thermocycler},
            new_location=labware_location,
            new_item=labware,
        )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"some_labware in slot {labware_location}"
            " prevents some_thermocycler from using slot 7"
        ),
    ):
        check(
            existing_items={labware_location: labware},
            new_location=7,
            new_item=thermocycler,
        )


@pytest.mark.parametrize(
    ("heater_shaker_location", "labware_location"),
    [
        (1, 2),
        (2, 1),
        (2, 3),
        (3, 2),
        (4, 5),
        (5, 4),
        (5, 6),
        (6, 5),
        (7, 8),
        (8, 7),
        (8, 9),
        (9, 8),
        (10, 11),
        (11, 10),
    ],
)
def test_labware_when_heater_shaker(
    decoy: Decoy,
    heater_shaker_location: int,
    labware_location: int,
) -> None:
    """It should allow short labware east and west if a heater-shaker is placed."""
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    cool_labware = decoy.mock(cls=DeckItem)
    lame_labware = decoy.mock(cls=DeckItem)

    decoy.when(heater_shaker.load_name).then_return("some_heater_shaker")
    decoy.when(heater_shaker.MAX_X_ADJACENT_ITEM_HEIGHT).then_return(10)
    decoy.when(cool_labware.load_name).then_return("cool_labware")
    decoy.when(cool_labware.highest_z).then_return(9.9)
    decoy.when(lame_labware.load_name).then_return("lame_labware")
    decoy.when(lame_labware.highest_z).then_return(10.1)

    check(
        existing_items={heater_shaker_location: heater_shaker},
        new_location=labware_location,
        new_item=cool_labware,
    )
    check(
        existing_items={labware_location: cool_labware},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
    )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents lame_labware from using slot {labware_location}"
        ),
    ):
        check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=labware_location,
            new_item=lame_labware,
        )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"lame_labware in slot {labware_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        check(
            existing_items={labware_location: lame_labware},
            new_location=heater_shaker_location,
            new_item=heater_shaker,
        )


@pytest.mark.parametrize(
    ("heater_shaker_location", "other_module_location"),
    [
        (1, 2),
        (1, 4),
        (2, 1),
        (2, 3),
        (2, 5),
        (3, 2),
        (3, 6),
        (4, 1),
        (4, 5),
        (4, 7),
        (5, 2),
        (5, 4),
        (5, 6),
        (5, 8),
        (6, 3),
        (6, 5),
        (6, 9),
        (7, 4),
        (7, 8),
        (7, 10),
        (8, 5),
        (8, 7),
        (8, 9),
        (8, 11),
        (9, 6),
        (9, 8),
        (10, 7),
        (10, 11),
        (11, 8),
        (11, 10),
    ],
)
def test_no_modules_when_heater_shaker(
    decoy: Decoy,
    heater_shaker_location: int,
    other_module_location: int,
) -> None:
    """It should not other modules north and south of the H/S.

    All modules are taller than the H/S height restriction,
    so this test only checks modules specifically in N/S.
    """
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    other_module = decoy.mock(cls=ModuleGeometry)

    decoy.when(heater_shaker.load_name).then_return("some_heater_shaker")
    decoy.when(other_module.load_name).then_return("some_other_module")

    with pytest.raises(
        DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents some_other_module from using slot {other_module_location}"
        ),
    ):
        check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=other_module_location,
            new_item=other_module,
        )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"some_other_module in slot {other_module_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        check(
            existing_items={other_module_location: other_module},
            new_location=heater_shaker_location,
            new_item=heater_shaker,
        )


@pytest.mark.parametrize(
    ("heater_shaker_location", "tip_rack_location"),
    [
        (1, 2),
        (2, 1),
        (2, 3),
        (3, 2),
        (4, 5),
        (5, 4),
        (5, 6),
        (6, 5),
        (7, 8),
        (8, 7),
        (8, 9),
        (9, 8),
        (10, 11),
        (11, 10),
    ],
)
def test_tip_rack_when_heater_shaker(
    decoy: Decoy,
    heater_shaker_location: int,
    tip_rack_location: int,
) -> None:
    """It should allow short tip racks east and west if a heater-shaker is placed."""
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    cool_tip_rack = decoy.mock(cls=AbstractLabware)
    lame_tip_rack = decoy.mock(cls=AbstractLabware)

    decoy.when(heater_shaker.load_name).then_return("some_heater_shaker")
    decoy.when(heater_shaker.MAX_X_ADJACENT_ITEM_HEIGHT).then_return(10)
    decoy.when(heater_shaker.ALLOWED_ADJACENT_TALL_LABWARE).then_return(
        [LabwareUri("test/cool_tip_rack/1")]
    )
    decoy.when(cool_tip_rack.load_name).then_return("cool_tip_rack")
    decoy.when(cool_tip_rack.highest_z).then_return(11)
    decoy.when(cool_tip_rack.get_uri()).then_return("test/cool_tip_rack/1")
    decoy.when(cool_tip_rack.get_quirks()).then_return([])
    decoy.when(lame_tip_rack.load_name).then_return("lame_tip_rack")
    decoy.when(lame_tip_rack.highest_z).then_return(11)
    decoy.when(lame_tip_rack.get_uri()).then_return("test/lame_tip_rack/1")
    decoy.when(lame_tip_rack.get_quirks()).then_return([])

    check(
        existing_items={heater_shaker_location: heater_shaker},
        new_location=tip_rack_location,
        new_item=cool_tip_rack,
    )
    check(
        existing_items={tip_rack_location: cool_tip_rack},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
    )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents lame_tip_rack from using slot {tip_rack_location}"
        ),
    ):
        check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=tip_rack_location,
            new_item=lame_tip_rack,
        )

    with pytest.raises(
        DeckConflictError,
        match=(
            f"lame_tip_rack in slot {tip_rack_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        check(
            existing_items={tip_rack_location: lame_tip_rack},
            new_location=heater_shaker_location,
            new_item=heater_shaker,
        )


def test_no_heater_shaker_west_of_trash(decoy: Decoy) -> None:
    """It should check that fixed trash does not conflict with heater-shaker."""
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    trash = decoy.mock(cls=Labware)

    decoy.when(trash.load_name).then_return("some_fixed_trash")
    decoy.when(trash.quirks).then_return(["fixedTrash"])
    decoy.when(trash.highest_z).then_return(11)

    decoy.when(heater_shaker.load_name).then_return("some_heater_shaker")
    decoy.when(heater_shaker.MAX_X_ADJACENT_ITEM_HEIGHT).then_return(10)

    with pytest.raises(
        DeckConflictError,
        match=(
            "some_fixed_trash in slot 12"
            " prevents some_heater_shaker from using slot 11"
        ),
    ):
        check(existing_items={12: trash}, new_item=heater_shaker, new_location=11)


def test_no_heater_shaker_south_of_trash_(decoy: Decoy) -> None:
    """It should check that fixed trash does not conflict with heater-shaker."""
    heater_shaker = decoy.mock(cls=HeaterShakerGeometry)
    trash = decoy.mock(cls=Labware)

    decoy.when(trash.load_name).then_return("some_fixed_trash")
    decoy.when(trash.quirks).then_return(["fixedTrash"])

    decoy.when(heater_shaker.load_name).then_return("some_heater_shaker")

    with pytest.raises(
        DeckConflictError,
        match=(
            "some_fixed_trash in slot 12"
            " prevents some_heater_shaker from using slot 9"
        ),
    ):
        check(existing_items={12: trash}, new_item=heater_shaker, new_location=9)
