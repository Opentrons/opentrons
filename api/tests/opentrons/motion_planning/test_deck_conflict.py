"""Tests for opentrons.protocols.geometry.deck_conflict."""
from typing import ContextManager
from contextlib import nullcontext

import pytest

from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.motion_planning import deck_conflict

from opentrons.types import DeckSlotName, StagingSlotName


@pytest.mark.parametrize(
    "robot_type, slot_name",
    [
        ("OT-2 Standard", DeckSlotName.SLOT_1),
        ("OT-3 Standard", DeckSlotName.SLOT_A1),
        ("OT-3 Standard", DeckSlotName.SLOT_A3),
    ],
)
def test_empty_no_conflict(robot_type: RobotType, slot_name: DeckSlotName) -> None:
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
    "robot_type, slot_name",
    [
        ("OT-2 Standard", DeckSlotName.SLOT_1),
        ("OT-3 Standard", DeckSlotName.SLOT_A1),
        ("OT-3 Standard", StagingSlotName.SLOT_A4),
    ],
)
def test_no_multiple_locations(robot_type: RobotType, slot_name: DeckSlotName) -> None:
    """It should not allow two items in the same slot."""
    item_1 = deck_conflict.Labware(
        uri=LabwareUri("some_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="some_item_1",
    )
    item_2 = deck_conflict.Labware(
        uri=LabwareUri("some_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="some_item_2",
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


@pytest.mark.parametrize(
    ("thermocycler_is_semi", "labware_location", "labware_should_be_allowed"),
    [
        # Non-semi config:
        (False, DeckSlotName.SLOT_1, True),
        (False, DeckSlotName.SLOT_7, False),
        (False, DeckSlotName.SLOT_8, False),
        (False, DeckSlotName.SLOT_10, False),
        (False, DeckSlotName.SLOT_11, False),
        # Semi config:
        (True, DeckSlotName.SLOT_1, True),
        (True, DeckSlotName.SLOT_7, False),
        (True, DeckSlotName.SLOT_8, True),
        (True, DeckSlotName.SLOT_10, False),
        (True, DeckSlotName.SLOT_11, True),
    ],
)
def test_labware_when_thermocycler(
    thermocycler_is_semi: bool,
    labware_location: DeckSlotName,
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
            existing_items={DeckSlotName.SLOT_7: thermocycler},
            new_location=labware_location,
            new_item=labware,
            robot_type="OT-2 Standard",
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
            new_location=DeckSlotName.SLOT_7,
            new_item=thermocycler,
            robot_type="OT-2 Standard",
        )


@pytest.mark.parametrize(
    ("labware_location", "labware_should_be_allowed"),
    [
        (DeckSlotName.SLOT_D1, True),
        (DeckSlotName.SLOT_B1, False),
        (DeckSlotName.SLOT_B2, True),
        (DeckSlotName.SLOT_A1, False),
        (DeckSlotName.SLOT_A2, True),
    ],
)
def test_flex_labware_when_thermocycler(
    labware_location: DeckSlotName,
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
            existing_items={DeckSlotName.SLOT_B1: thermocycler},
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
            new_location=DeckSlotName.SLOT_B1,
            new_item=thermocycler,
            robot_type="OT-3 Standard",
        )


def test_flex_trash_bin_blocks_thermocycler() -> None:
    """It should prevent loading a thermocycler when there is a trash in A1 and vice-versa."""
    thermocycler = deck_conflict.ThermocyclerModule(
        name_for_errors="some_thermocycler",
        highest_z_including_labware=123,
        is_semi_configuration=False,
    )
    trash = deck_conflict.TrashBin(name_for_errors="some_trash_bin")

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            "some_trash_bin in slot A1" " prevents some_thermocycler from using slot B1"
        ),
    ):
        deck_conflict.check(
            existing_items={DeckSlotName.SLOT_A1: trash},
            new_item=thermocycler,
            new_location=DeckSlotName.SLOT_B1,
            robot_type="OT-3 Standard",
        )
    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            "some_thermocycler in slot B1" " prevents some_trash_bin from using slot A1"
        ),
    ):
        deck_conflict.check(
            existing_items={DeckSlotName.SLOT_B1: thermocycler},
            new_item=trash,
            new_location=DeckSlotName.SLOT_A1,
            robot_type="OT-3 Standard",
        )


@pytest.mark.parametrize(
    ("heater_shaker_location", "labware_location"),
    [
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_1),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_3),
        (DeckSlotName.SLOT_3, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_4),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_6),
        (DeckSlotName.SLOT_6, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_7, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_7),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_9),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_10, DeckSlotName.SLOT_11),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_10),
    ],
)
def test_labware_when_heater_shaker(
    heater_shaker_location: DeckSlotName,
    labware_location: DeckSlotName,
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
        robot_type="OT-2 Standard",
    )
    deck_conflict.check(
        existing_items={labware_location: cool_labware},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
        robot_type="OT-2 Standard",
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
            robot_type="OT-2 Standard",
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
            robot_type="OT-2 Standard",
        )


@pytest.mark.parametrize(
    ("heater_shaker_location", "other_module_location"),
    [
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_4),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_1),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_3),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_3, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_3, DeckSlotName.SLOT_6),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_1),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_7),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_4),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_6),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_6, DeckSlotName.SLOT_3),
        (DeckSlotName.SLOT_6, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_6, DeckSlotName.SLOT_9),
        (DeckSlotName.SLOT_7, DeckSlotName.SLOT_4),
        (DeckSlotName.SLOT_7, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_7, DeckSlotName.SLOT_10),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_7),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_9),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_11),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_6),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_10, DeckSlotName.SLOT_7),
        (DeckSlotName.SLOT_10, DeckSlotName.SLOT_11),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_10),
    ],
)
def test_no_modules_when_heater_shaker(
    heater_shaker_location: DeckSlotName,
    other_module_location: DeckSlotName,
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
            robot_type="OT-2 Standard",
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
            robot_type="OT-2 Standard",
        )


@pytest.mark.parametrize(
    "allowed_tip_rack_uri",
    deck_conflict.HS_ALLOWED_ADJACENT_TALL_LABWARE,
)
@pytest.mark.parametrize(
    ("heater_shaker_location", "tip_rack_location"),
    [
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_1),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_3),
        (DeckSlotName.SLOT_3, DeckSlotName.SLOT_2),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_4),
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_6),
        (DeckSlotName.SLOT_6, DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_7, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_7),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_9),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_8),
        (DeckSlotName.SLOT_10, DeckSlotName.SLOT_11),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_10),
    ],
)
def test_tip_rack_when_heater_shaker(
    allowed_tip_rack_uri: LabwareUri,
    heater_shaker_location: DeckSlotName,
    tip_rack_location: DeckSlotName,
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
        robot_type="OT-2 Standard",
    )
    deck_conflict.check(
        existing_items={tip_rack_location: cool_tip_rack},
        new_location=heater_shaker_location,
        new_item=heater_shaker,
        robot_type="OT-2 Standard",
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
            robot_type="OT-2 Standard",
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
            robot_type="OT-2 Standard",
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
            existing_items={DeckSlotName.FIXED_TRASH: trash},
            new_item=heater_shaker,
            new_location=DeckSlotName.SLOT_9,
            robot_type="OT-2 Standard",
        )


def test_heater_shaker_restrictions_trash_bin_addressable_area() -> None:
    """It should prevent loading a Heater-Shaker adjacent of a non-labware trash bin.

    This is for the OT-2 only and for slot 11 and slot 9
    """
    heater_shaker = deck_conflict.HeaterShakerModule(
        highest_z_including_labware=123, name_for_errors="some_heater_shaker"
    )
    trash = deck_conflict.TrashBin(name_for_errors="some_trash_bin")

    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            "some_trash_bin in slot 12" " prevents some_heater_shaker from using slot 9"
        ),
    ):
        deck_conflict.check(
            existing_items={DeckSlotName.FIXED_TRASH: trash},
            new_item=heater_shaker,
            new_location=DeckSlotName.SLOT_9,
            robot_type="OT-2 Standard",
        )
    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            "some_trash_bin in slot 12"
            " prevents some_heater_shaker from using slot 11"
        ),
    ):
        deck_conflict.check(
            existing_items={DeckSlotName.FIXED_TRASH: trash},
            new_item=heater_shaker,
            new_location=DeckSlotName.SLOT_11,
            robot_type="OT-2 Standard",
        )


@pytest.mark.parametrize(
    ("deck_slot_name", "adjacent_staging_slot", "non_adjacent_staging_slot"),
    [
        (DeckSlotName.SLOT_A3, StagingSlotName.SLOT_A4, StagingSlotName.SLOT_B4),
        (DeckSlotName.SLOT_B3, StagingSlotName.SLOT_B4, StagingSlotName.SLOT_C4),
        (DeckSlotName.SLOT_C3, StagingSlotName.SLOT_C4, StagingSlotName.SLOT_D4),
        (DeckSlotName.SLOT_D3, StagingSlotName.SLOT_D4, StagingSlotName.SLOT_A4),
    ],
)
def test_no_staging_slot_adjacent_to_module(
    deck_slot_name: DeckSlotName,
    adjacent_staging_slot: StagingSlotName,
    non_adjacent_staging_slot: StagingSlotName,
) -> None:
    """It should raise if certain modules are placed adjacent to labware on a staging slot."""
    staging_slot_labware = deck_conflict.Labware(
        uri=LabwareUri("some_labware_uri"),
        highest_z=123,
        is_fixed_trash=False,
        name_for_errors="some_labware",
    )
    heater_shaker = deck_conflict.HeaterShakerModule(
        name_for_errors="some_heater_shaker",
        highest_z_including_labware=123,
    )
    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_labware in slot {adjacent_staging_slot}"
            f" prevents some_heater_shaker from using slot {deck_slot_name}"
        ),
    ):
        deck_conflict.check(
            existing_items={adjacent_staging_slot: staging_slot_labware},
            new_item=heater_shaker,
            new_location=deck_slot_name,
            robot_type="OT-3 Standard",
        )

    # Non-adjacent staging slot passes
    deck_conflict.check(
        existing_items={non_adjacent_staging_slot: staging_slot_labware},
        new_item=heater_shaker,
        new_location=deck_slot_name,
        robot_type="OT-3 Standard",
    )

    other_module = deck_conflict.OtherModule(
        name_for_errors="some_other_module",
        highest_z_including_labware=123,
    )
    with pytest.raises(
        deck_conflict.DeckConflictError,
        match=(
            f"some_other_module in slot {deck_slot_name}"
            f" prevents some_labware from using slot {adjacent_staging_slot}"
        ),
    ):
        deck_conflict.check(
            existing_items={deck_slot_name: other_module},
            new_item=staging_slot_labware,
            new_location=adjacent_staging_slot,
            robot_type="OT-3 Standard",
        )

    # Magnetic block is allowed
    magnetic_block = deck_conflict.MagneticBlockModule(
        name_for_errors="some_mag_block",
        highest_z_including_labware=123,
    )
    deck_conflict.check(
        existing_items={adjacent_staging_slot: staging_slot_labware},
        new_item=magnetic_block,
        new_location=deck_slot_name,
        robot_type="OT-3 Standard",
    )
