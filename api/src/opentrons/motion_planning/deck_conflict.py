"""Check a deck layout for conflicts."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Mapping, NamedTuple, Optional, Set, Union
from typing_extensions import Final

from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType
from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_south_slot,
    get_adjacent_slots,
    get_adjacent_staging_slot,
)

from opentrons.types import DeckSlotName, StagingSlotName

_FIXED_TRASH_SLOT: Final[Set[DeckSlotName]] = {
    DeckSlotName.FIXED_TRASH,
    DeckSlotName.SLOT_A3,
}


# The maximum height allowed for items adjacent to a Heater-Shaker in the x-direction.
# This value selected to avoid interference with the Heater-Shaker's labware latch.
# For background, see: https://github.com/Opentrons/opentrons/issues/10316
#
# TODO(mc, 2022-06-16): move this constant to the module definition
HS_MAX_X_ADJACENT_ITEM_HEIGHT = 53.0


# URIs of labware that are allowed to exceed HS_MAX_X_ADJACENT_ITEM_HEIGHT.
# These labware do not take up the full width of the slot
# in the area that would interfere with the labware latch.
# For background, see: https://github.com/Opentrons/opentrons/issues/10316
#
# TODO(mc, 2022-06-16): move this constant to the module definition
HS_ALLOWED_ADJACENT_TALL_LABWARE = [
    LabwareUri("opentrons/opentrons_96_filtertiprack_10ul/1"),
    LabwareUri("opentrons/opentrons_96_filtertiprack_200ul/1"),
    LabwareUri("opentrons/opentrons_96_filtertiprack_20ul/1"),
    LabwareUri("opentrons/opentrons_96_tiprack_10ul/1"),
    LabwareUri("opentrons/opentrons_96_tiprack_20ul/1"),
    LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
]


@dataclass
class Labware:
    """A normal labware that directly occupies a slot.

    Do not use this to represent a labware that's loaded atop a module.
    Use one of the module types, instead.
    """

    name_for_errors: str
    highest_z: float
    uri: LabwareUri
    is_fixed_trash: bool


@dataclass
class TrashBin:
    """A non-labware trash bin (loaded via api level 2.16 and above)."""

    name_for_errors: str
    highest_z: float


@dataclass
class _Module:
    name_for_errors: str
    highest_z_including_labware: float


@dataclass
class HeaterShakerModule(_Module):
    """A Heater-Shaker module."""


@dataclass
class MagneticBlockModule(_Module):
    """A Magnetic Block module."""


@dataclass
class ThermocyclerModule(_Module):
    """A Thermocycler module."""

    is_semi_configuration: bool
    """Whether this Thermocycler is loaded in its "semi" configuration.

    In this configuration, it's offset to the left, so it takes up fewer deck slots.
    """


@dataclass
class OtherModule(_Module):
    """A module that's not a Heater-Shaker or Thermocycler."""


DeckItem = Union[
    Labware,
    HeaterShakerModule,
    MagneticBlockModule,
    ThermocyclerModule,
    OtherModule,
    TrashBin,
]


class _NothingAllowed(NamedTuple):
    """Nothing is allowed in this slot."""

    location: Union[DeckSlotName, StagingSlotName]
    source_item: DeckItem
    source_location: Union[DeckSlotName, StagingSlotName]

    def is_allowed(self, item: DeckItem) -> bool:
        return False


class _MaxHeight(NamedTuple):
    """Nothing over a certain height is allowed in this slot."""

    location: DeckSlotName
    source_item: DeckItem
    source_location: DeckSlotName
    max_height: float
    allowed_labware: List[LabwareUri]

    def is_allowed(self, item: DeckItem) -> bool:
        if isinstance(item, Labware):
            if item.uri in self.allowed_labware:
                return True
            else:
                return item.highest_z < self.max_height
        elif isinstance(item, _Module):
            return item.highest_z_including_labware < self.max_height
        elif isinstance(item, TrashBin):
            return item.highest_z < self.max_height


class _NoModule(NamedTuple):
    """No module of any kind is allowed in this slot."""

    location: DeckSlotName
    source_item: DeckItem
    source_location: DeckSlotName

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, _Module)


class _NoHeaterShakerModule(NamedTuple):
    """No Heater-Shaker module is allowed in this slot."""

    location: DeckSlotName
    source_item: DeckItem
    source_location: DeckSlotName

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, HeaterShakerModule)


_DeckRestriction = Union[
    _NothingAllowed,
    _MaxHeight,
    _NoModule,
    _NoHeaterShakerModule,
]
"""A restriction on what is allowed in a given slot."""


class DeckConflictError(ValueError):
    """Adding an item to the deck would cause a conflict."""


# TODO(mm, 2023-02-16): Taking a single int as the deck location doesn't make sense for
# things that don't fit into a single deck slot, like the Thermocycler.
# Refactor this interface to take a more symbolic location.
def check(
    existing_items: Mapping[Union[DeckSlotName, StagingSlotName], DeckItem],
    new_item: DeckItem,
    new_location: Union[DeckSlotName, StagingSlotName],
    robot_type: RobotType,
) -> None:
    """Check a deck layout for conflicts.

    Args:
        existing_items: Existing items on the deck, assumed to be valid.
        new_item: New item to add to the deck.
        new_location: Location where the new item will be added.
        robot_type: The type of the robot to choose the restriction rules.

    Raises:
        DeckConflictError: Adding this item should not be allowed.
    """
    restrictions: List[_DeckRestriction] = []
    # build restrictions driven by existing items
    for location, item in existing_items.items():
        restrictions += _create_restrictions(
            item=item, location=location, robot_type=robot_type
        )

    # check new item against existing restrictions
    for r in restrictions:
        if r.location == new_location and not r.is_allowed(new_item):
            raise DeckConflictError(
                _create_deck_conflict_error_message(restriction=r, new_item=new_item)
            )

    # check new restrictions required by new item
    # do not interfere with existing items
    new_restrictions = _create_restrictions(
        item=new_item, location=new_location, robot_type=robot_type
    )

    for r in new_restrictions:
        existing_item = existing_items.get(r.location)
        if existing_item is not None and not r.is_allowed(existing_item):
            raise DeckConflictError(
                _create_deck_conflict_error_message(
                    restriction=r,
                    existing_item=existing_item,
                )
            )


def _create_ot2_restrictions(  # noqa: C901
    item: DeckItem, location: Union[DeckSlotName, StagingSlotName]
) -> List[_DeckRestriction]:
    restrictions: List[_DeckRestriction] = []
    if isinstance(location, StagingSlotName):
        raise DeckConflictError(f"OT-2 does not support staging slots ({location.id}).")

    if location not in _FIXED_TRASH_SLOT:
        # Disallow a different item from overlapping this item in this deck slot.
        restrictions.append(
            _NothingAllowed(
                location=location,
                source_item=item,
                source_location=location,
            )
        )

    if _is_ot2_fixed_trash(item):
        # A Heater-Shaker can't safely be placed just south of the fixed trash,
        # because the fixed trash blocks access to the screw that locks the
        # Heater-Shaker onto the deck.
        location_south_of_fixed_trash = get_south_slot(location.as_int())
        if location_south_of_fixed_trash is not None:
            restrictions.append(
                _NoHeaterShakerModule(
                    location=DeckSlotName.from_primitive(location_south_of_fixed_trash),
                    source_item=item,
                    source_location=location,
                )
            )

    if isinstance(item, ThermocyclerModule):
        for covered_location in _ot2_slots_covered_by_thermocycler(item):
            restrictions.append(
                _NothingAllowed(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

    if isinstance(item, HeaterShakerModule):
        for hs_covered_location in get_adjacent_slots(location.as_int()):
            restrictions.append(
                _NoModule(
                    location=DeckSlotName.from_primitive(hs_covered_location),
                    source_item=item,
                    source_location=location,
                )
            )

        for hs_covered_location in get_east_west_slots(location.as_int()):
            restrictions.append(
                _MaxHeight(
                    location=DeckSlotName.from_primitive(hs_covered_location),
                    source_item=item,
                    source_location=location,
                    max_height=HS_MAX_X_ADJACENT_ITEM_HEIGHT,
                    allowed_labware=HS_ALLOWED_ADJACENT_TALL_LABWARE,
                )
            )

    return restrictions


def _create_flex_restrictions(
    item: DeckItem, location: Union[DeckSlotName, StagingSlotName]
) -> List[_DeckRestriction]:
    restrictions: List[_DeckRestriction] = [
        _NothingAllowed(
            location=location,
            source_item=item,
            source_location=location,
        )
    ]

    if isinstance(item, (HeaterShakerModule, OtherModule)):
        if isinstance(location, StagingSlotName):
            raise DeckConflictError(
                "Cannot have a module loaded on a staging area slot."
            )
        adjacent_staging_slot = get_adjacent_staging_slot(location)
        if adjacent_staging_slot is not None:
            # You can't have anything on a staging area slot next to a heater-shaker or
            # temperature module because the module caddy physically blocks you from having
            # that staging area slot installed in the first place.
            restrictions.append(
                _NothingAllowed(
                    location=adjacent_staging_slot,
                    source_item=item,
                    source_location=location,
                )
            )

    elif isinstance(item, ThermocyclerModule):
        for covered_location in _flex_slots_covered_by_thermocycler():
            restrictions.append(
                _NothingAllowed(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

    return restrictions


def _create_restrictions(
    item: DeckItem, location: Union[DeckSlotName, StagingSlotName], robot_type: str
) -> List[_DeckRestriction]:

    if robot_type == "OT-2 Standard":
        return _create_ot2_restrictions(item, location)
    else:
        return _create_flex_restrictions(item, location)


def _create_deck_conflict_error_message(
    restriction: _DeckRestriction,
    new_item: Optional[DeckItem] = None,
    existing_item: Optional[DeckItem] = None,
) -> str:
    assert (
        new_item is not None or existing_item is not None
    ), "Conflict error expects either new_item or existing_item"

    if new_item is not None:
        message = (
            f"{restriction.source_item.name_for_errors}"
            f" in slot {restriction.source_location}"
            f" prevents {new_item.name_for_errors}"
            f" from using slot {restriction.location}."
        )

    elif existing_item is not None:
        message = (
            f"{existing_item.name_for_errors} in slot {restriction.location}"
            f" prevents {restriction.source_item.name_for_errors}"
            f" from using slot {restriction.source_location}."
        )

    return message


def _ot2_slots_covered_by_thermocycler(
    thermocycler: ThermocyclerModule,
) -> Set[DeckSlotName]:
    if thermocycler.is_semi_configuration:
        return {DeckSlotName.SLOT_7, DeckSlotName.SLOT_10}
    else:
        return {
            DeckSlotName.SLOT_7,
            DeckSlotName.SLOT_10,
            DeckSlotName.SLOT_8,
            DeckSlotName.SLOT_11,
        }


def _flex_slots_covered_by_thermocycler() -> Set[DeckSlotName]:
    return {DeckSlotName.SLOT_B1, DeckSlotName.SLOT_A1}


def _is_ot2_fixed_trash(item: DeckItem) -> bool:
    return (isinstance(item, Labware) and item.is_fixed_trash) or isinstance(
        item, TrashBin
    )
