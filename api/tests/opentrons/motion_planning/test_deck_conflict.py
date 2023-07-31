"""Tests for opentrons.protocols.geometry.deck_conflict."""
from typing import ContextManager
from contextlib import nullcontext

import pytest

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.motion_planning import deck_conflict


@pytest.mark.parametrize(
    "robot_type, slot_name", [("OT-2 Standard", "1"), ("OT-3 Standard", "A1")]
)
def test_empty_no_conflict(robot_type: str, slot_name: str) -> None:
    """It should not raise on empty input."""
    deck_conflict.check(
        existing_items={},
        new_item=deck_conflict.OtherModule(
            highest_z_including_labware=123, name_for_errors="foo"
        ),
        new_location=slot_name,
        robot_type=robot_type,
    )


@pytest.mark.parametrize(
    "robot_type, slot_name", [("OT-2 Standard", "1"), ("OT-3 Standard", "A1")]
)
def test_no_multiple_locations(robot_type: str, slot_name: str) -> None:
    """It should not allow two items in the same slot."""
    item_1 = deck_conflict.OtherModule(
        highest_z_including_labware=123, name_for_errors="some_item_1"
    )
    item_2 = deck_conflict.OtherModule(
        highest_z_including_labware=123, name_for_errors="some_item_2"
    )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=f"some_item_1 in slot {slot_name} prevents some_item_2 from using slot {slot_name}",
    ):
        deck_conflict.check(
            existing_items={slot_name: item_1},
            new_item=item_2,
            new_location=slot_name,
            robot_type=robot_type,
        )


def test_only_trash_in_12() -> None:
    """It should only allow trash labware in slot 12."""
    trash_labware = deck_conflict.Labware(
        uri=LabwareUri("trash_labware_uri"),
        highest_z=123,
        is_fixed_trash=True,
        name_for_errors="trash_labware",
    )
    not_trash_labware = deck_conflict.Labware(
        uri=LabwareUri("not_trash_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="not_trash_labware",
    )
    not_trash_module = deck_conflict.OtherModule(
        highest_z_including_labware=123, name_for_errors="not_trash_module"
    )

    deck_conflict.check(existing_items={}, new_item=trash_labware, new_location=12)

    with pytest.raises(
        deck_conflict.DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        deck_conflict.check(
            existing_items={}, new_item=not_trash_labware, new_location=12
        )

    with pytest.raises(
        deck_conflict.DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        deck_conflict.check(
            existing_items={}, new_item=not_trash_module, new_location=12
        )


def test_trash_override() -> None:
    """It should allow the trash labware to be replaced with another trash labware."""
    trash_labware_1 = deck_conflict.Labware(
        uri=LabwareUri("trash_labware_1_uri"),
        highest_z=123,
        is_fixed_trash=True,
        name_for_errors="trash_labware_1",
    )
    trash_labware_2 = deck_conflict.Labware(
        uri=LabwareUri("trash_labware_2_uri"),
        highest_z=123,
        is_fixed_trash=True,
        name_for_errors="trash_labware_2",
    )
    not_trash_labware = deck_conflict.Labware(
        uri=LabwareUri("not_trash_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="not_trash_labware",
    )
    not_trash_module = deck_conflict.OtherModule(
        highest_z_including_labware=123, name_for_errors="not_trash_module"
    )

    deck_conflict.check(
        existing_items={12: trash_labware_1},
        new_item=trash_labware_2,
        new_location=12,
    )

    with pytest.raises(
        deck_conflict.DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        deck_conflict.check(
            existing_items={12: trash_labware_1},
            new_item=not_trash_labware,
            new_location=12,
        )

    with pytest.raises(
        deck_conflict.DeckConflictError, match="Only fixed-trash is allowed in slot 12"
    ):
        deck_conflict.check(
            existing_items={12: trash_labware_1},
            new_item=not_trash_module,
            new_location=12,
        )


@pytest.mark.parametrize(
    ("thermocycler_is_semi", "labware_location", "labware_should_be_allowed"),
    [
        # Non-semi config:
        (False, 1, True),
        (False, 7, False),
        (False, 8, False),
        (False, 10, False),
        (False, 11, False),
        # Semi config:
        (True, 1, True),
        (True, 7, False),
        (True, 8, True),
        (True, 10, False),
        (True, 11, True),
    ],
)
def test_labware_when_thermocycler(
    thermocycler_is_semi: bool,
    labware_location: int,
    labware_should_be_allowed: bool,
) -> None:
    """It should reject labware if a Thermocycler covers the same slot."""
    thermocycler = deck_conflict.ThermocyclerModule(
        name_for_errors="some_thermocycler",
        highest_z_including_labware=123,
        is_semi_configuration=thermocycler_is_semi,
    )

    labware = deck_conflict.Labware(
        uri=LabwareUri("some_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="some_labware",
    )

    maybe_raises: ContextManager[object]
    if labware_should_be_allowed:
        maybe_raises = nullcontext()  # Expecct no exception.
    else:
        maybe_raises = pytest.raises(  # Expect an exception..
            deck_conflict.DeckConflictError,
            match=(
                "some_thermocycler in slot 7 prevents"
                f" some_labware from using slot {labware_location}"
            ),
        )
    with maybe_raises:
        deck_conflict.check(
            existing_items={7: thermocycler},
            new_location=labware_location,
            new_item=labware,
        )

    if labware_should_be_allowed:
        maybe_raises = nullcontext()  # Expecct no exception.
    else:
        maybe_raises = pytest.raises(  # Expect an exception..
            deck_conflict.DeckConflictError,
            match=(
                f"some_labware in slot {labware_location}"
                " prevents some_thermocycler from using slot 7"
            ),
        )
    with maybe_raises:
        deck_conflict.check(
            existing_items={labware_location: labware},
            new_location=7,
            new_item=thermocycler,
        )


@pytest.mark.parametrize(
    ("labware_location", "labware_should_be_allowed"),
    [
        ("D1", True),
        ("B1", False),
        ("B2", True),
        ("A1", False),
        ("A2", True),
    ],
)
def test_flex_labware_when_thermocycler(
    labware_location: str,
    labware_should_be_allowed: bool,
) -> None:
    """It should reject labware if a Thermocycler covers the same slot."""
    thermocycler = deck_conflict.ThermocyclerModule(
        name_for_errors="some_thermocycler",
        highest_z_including_labware=123,
        is_semi_configuration=False,
    )

    labware = deck_conflict.Labware(
        uri=LabwareUri("some_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="some_labware",
    )

    maybe_raises: ContextManager[object]
    if labware_should_be_allowed:
        maybe_raises = nullcontext()  # Expecct no exception.
    else:
        maybe_raises = pytest.raises(  # Expect an exception..
            deck_conflict.DeckConflictError,
            match=(
                "some_thermocycler in slot B1 prevents"
                f" some_labware from using slot {labware_location}"
            ),
        )
    with maybe_raises:
        deck_conflict.check(
            existing_items={"B1": thermocycler},
            new_location=labware_location,
            new_item=labware,
            robot_type="OT-3 Standard",
        )

    if labware_should_be_allowed:
        maybe_raises = nullcontext()  # Expecct no exception.
    else:
        maybe_raises = pytest.raises(  # Expect an exception..
            deck_conflict.DeckConflictError,
            match=(
                f"some_labware in slot {labware_location}"
                " prevents some_thermocycler from using slot B1"
            ),
        )
    with maybe_raises:
        deck_conflict.check(
            existing_items={labware_location: labware},
            new_location="B1",
            new_item=thermocycler,
            robot_type="OT-3 Standard",
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
    heater_shaker_location: int,
    labware_location: int,
) -> None:
    """It should allow short labware east and west if a heater-shaker is placed."""
    heater_shaker = deck_conflict.HeaterShakerModule(
        highest_z_including_labware=123, name_for_errors="some_heater_shaker"
    )
    cool_labware = deck_conflict.Labware(
        uri=LabwareUri("cool_labware_uri"),
        highest_z=1,
        is_fixed_trash=False,
        name_for_errors="cool_labware",
    )
    lame_labware = deck_conflict.Labware(
        uri=LabwareUri("lame_labware_uri"),
        highest_z=999,
        is_fixed_trash=False,
        name_for_errors="lame_labware",
    )

    deck_conflict.check(
        existing_items={heater_shaker_location: heater_shaker},
        new_location=labware_location,
        new_item=cool_labware,
    )
    deck_conflict.check(
        existing_items={labware_location: cool_labware},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
    )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents lame_labware from using slot {labware_location}"
        ),
    ):
        deck_conflict.check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=labware_location,
            new_item=lame_labware,
        )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"lame_labware in slot {labware_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        deck_conflict.check(
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
    heater_shaker_location: int,
    other_module_location: int,
) -> None:
    """It should not allow other modules north and south of the H/S.

    All modules are taller than the H/S height restriction,
    so this test only checks modules specifically in N/S.
    """
    heater_shaker = deck_conflict.HeaterShakerModule(
        highest_z_including_labware=123, name_for_errors="some_heater_shaker"
    )
    other_module = deck_conflict.OtherModule(
        highest_z_including_labware=0, name_for_errors="some_other_module"
    )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents some_other_module from using slot {other_module_location}"
        ),
    ):
        deck_conflict.check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=other_module_location,
            new_item=other_module,
        )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_other_module in slot {other_module_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        deck_conflict.check(
            existing_items={other_module_location: other_module},
            new_location=heater_shaker_location,
            new_item=heater_shaker,
        )


@pytest.mark.parametrize(
    "allowed_tip_rack_uri",
    deck_conflict.HS_ALLOWED_ADJACENT_TALL_LABWARE,
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
    allowed_tip_rack_uri: LabwareUri,
    heater_shaker_location: int,
    tip_rack_location: int,
) -> None:
    """It should allow short tip racks east and west if a heater-shaker is placed."""
    heater_shaker = deck_conflict.HeaterShakerModule(
        highest_z_including_labware=123,
        name_for_errors="some_heater_shaker",
    )

    too_high = deck_conflict.HS_MAX_X_ADJACENT_ITEM_HEIGHT + 0.1

    cool_tip_rack = deck_conflict.Labware(
        uri=allowed_tip_rack_uri,
        highest_z=too_high,
        is_fixed_trash=False,
        name_for_errors="cool_tip_rack",
    )

    lame_tip_rack = deck_conflict.Labware(
        uri=LabwareUri("test/lame_tip_rack/1"),
        highest_z=too_high,
        is_fixed_trash=False,
        name_for_errors="lame_tip_rack",
    )

    deck_conflict.check(
        existing_items={heater_shaker_location: heater_shaker},
        new_location=tip_rack_location,
        new_item=cool_tip_rack,
    )
    deck_conflict.check(
        existing_items={tip_rack_location: cool_tip_rack},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
    )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_heater_shaker in slot {heater_shaker_location}"
            f" prevents lame_tip_rack from using slot {tip_rack_location}"
        ),
    ):
        deck_conflict.check(
            existing_items={heater_shaker_location: heater_shaker},
            new_location=tip_rack_location,
            new_item=lame_tip_rack,
        )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"lame_tip_rack in slot {tip_rack_location}"
            f" prevents some_heater_shaker from using slot {heater_shaker_location}"
        ),
    ):
        deck_conflict.check(
            existing_items={tip_rack_location: lame_tip_rack},
            new_location=heater_shaker_location,
            new_item=heater_shaker,
        )


def test_no_heater_shaker_south_of_trash() -> None:
    """It should prevent loading a Heater-Shaker south of a fixed trash.

    This is because the trash prevents accessing the Heater-Shaker's anchor screw.

    Unrelated restrictions on height may prevent putting a Heater-Shaker in other places
    around the fixed trash. Those restrictions should be covered by HS<->labware tests.
    """
    heater_shaker = deck_conflict.HeaterShakerModule(
        highest_z_including_labware=123, name_for_errors="some_heater_shaker"
    )
    trash = deck_conflict.Labware(
        # We want to test that the subject rejects the HS placement on account of this
        # labware being a fixed trash, not on account of this labware being too tall.
        highest_z=0,
        name_for_errors="some_fixed_trash",
        uri=LabwareUri("test/some_fixed_trash/1"),
        is_fixed_trash=True,
    )

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            "some_fixed_trash in slot 12"
            " prevents some_heater_shaker from using slot 9"
        ),
    ):
        deck_conflict.check(
            existing_items={12: trash},
            new_item=heater_shaker,
            new_location=9,
        )


@pytest.mark.parametrize(
    "deck_item",
    [
        (
            deck_conflict.HeaterShakerModule(
                highest_z_including_labware=123,
                name_for_errors="some_heater_shaker",
            )
        ),
        (
            deck_conflict.TemperatureModule(
                highest_z_including_labware=123,
                name_for_errors="some_temp_deck",
            )
        ),
    ],
)
def test_flex_raises_module_in_wrong_location(
    deck_item: deck_conflict.DeckItem,
) -> None:
    """It should raise when trying to load a module in a disallowed location."""
    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(f"{deck_item.name_for_errors} is not allowed in slot A2"),
    ):
        deck_conflict.check(
            existing_items={},
            new_location="A2",
            new_item=deck_item,
            robot_type="OT-3 Standard",
        )
