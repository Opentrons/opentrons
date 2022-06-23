"""Check a deck layout for conflicts."""
# TODO(mc, 2022-06-15): decouple this interface from DeckItem
# (and subclasses) so it can be used in ProtocolEngine
from typing import List, Mapping, NamedTuple, Optional, Union
from typing_extensions import Final

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.protocol_api.labware import Labware
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)

from .deck_item import DeckItem


_FIXED_TRASH_SLOT: Final = 12


class _NotAllowed(NamedTuple):
    """Nothing is allowed in this slot."""

    location: int
    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return False


class _MaxHeight(NamedTuple):
    """Nothing over a certain height is allowed in this slot."""

    location: int
    source_item: DeckItem
    source_location: int
    max_height: float
    allowed_labware: List[LabwareUri]

    def is_allowed(self, item: DeckItem) -> bool:
        if isinstance(item, AbstractLabware) and item.get_uri() in self.allowed_labware:
            return True

        return item.highest_z < self.max_height


class _NoModule(NamedTuple):
    """A module is not allowed in this slot."""

    location: int
    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, ModuleGeometry)


class _FixedTrash(NamedTuple):
    """Only fixed-trash labware is allowed in this slot."""

    location: int = _FIXED_TRASH_SLOT

    def is_allowed(self, item: DeckItem) -> bool:
        if isinstance(item, AbstractLabware):
            return "fixedTrash" in item.get_quirks()
        if isinstance(item, Labware):
            return "fixedTrash" in item.quirks

        return False


_DeckRestriction = Union[_NotAllowed, _MaxHeight, _NoModule, _FixedTrash]
"""A restriction on what is allowed in a given slot."""


class DeckConflictError(ValueError):
    """Adding an item to the deck would cause a conflict."""


def check(
    existing_items: Mapping[int, DeckItem],
    new_item: DeckItem,
    new_location: int,
) -> None:
    """Check a deck layout for conflicts.

    Args:
        existing_items: Existing items on the deck, assumed to be valid.
        new_item: New item to add to the deck.
        new_location: Location where the new item will be added.

    Raises:
        DeckConflictError: Adding this item should not be allowed.
    """
    restrictions: List[_DeckRestriction] = [_FixedTrash()]

    # build restrictions driven by existing items
    for location, item in existing_items.items():
        restrictions += _create_restrictions(item=item, location=location)

    # check new item against existing restrictions
    for r in restrictions:
        if r.location == new_location and not r.is_allowed(new_item):
            raise DeckConflictError(
                _create_deck_conflict_error_message(restriction=r, new_item=new_item)
            )

    # check new restrictions required by new item
    # do not interfere with existing items
    new_restrictions = _create_restrictions(item=new_item, location=new_location)

    for r in new_restrictions:
        existing_item = existing_items.get(r.location)
        if existing_item is not None and not r.is_allowed(existing_item):
            raise DeckConflictError(
                _create_deck_conflict_error_message(
                    restriction=r,
                    existing_item=existing_item,
                )
            )


def _create_restrictions(item: DeckItem, location: int) -> List[_DeckRestriction]:
    restrictions: List[_DeckRestriction] = []

    if location != _FIXED_TRASH_SLOT:
        restrictions.append(
            _NotAllowed(
                location=location,
                source_item=item,
                source_location=location,
            )
        )

    if isinstance(item, ThermocyclerGeometry):
        for covered_location in item.covered_slots:
            restrictions.append(
                _NotAllowed(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

    if isinstance(item, HeaterShakerGeometry):
        for covered_location in _get_adjacent_locations(location):
            restrictions.append(
                _NoModule(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

        for covered_location in _get_east_west_locations(location):
            restrictions.append(
                _MaxHeight(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                    max_height=item.MAX_X_ADJACENT_ITEM_HEIGHT,
                    allowed_labware=item.ALLOWED_ADJACENT_TALL_LABWARE,
                )
            )

    return restrictions


def _create_deck_conflict_error_message(
    restriction: _DeckRestriction,
    new_item: Optional[DeckItem] = None,
    existing_item: Optional[DeckItem] = None,
) -> str:
    assert (
        new_item is not None or existing_item is not None
    ), "Conflict error expects either new_item or existing_item"

    if isinstance(restriction, _FixedTrash):
        message = f"Only fixed-trash is allowed in slot {restriction.location}"

    elif new_item is not None:
        message = (
            f"{restriction.source_item.load_name}"
            f" in slot {restriction.source_location}"
            f" prevents {new_item.load_name}"
            f" from using slot {restriction.location}."
        )

    elif existing_item is not None:
        message = (
            f"{existing_item.load_name} in slot {restriction.location}"
            f" prevents {restriction.source_item.load_name}"
            f" from using slot {restriction.source_location}."
        )

    return message


def _get_east_west_locations(location: int) -> List[int]:
    if location in [1, 4, 7, 10]:
        return [location + 1]
    elif location in [2, 5, 8, 11]:
        return [location - 1, location + 1]
    else:
        return [location - 1]


def _get_adjacent_locations(location: int) -> List[int]:
    if location in [1, 2, 3]:
        north_south = [location + 3]
    elif location in [4, 5, 6, 7, 8, 9]:
        north_south = [location - 3, location + 3]
    else:
        north_south = [location - 3]

    return north_south + _get_east_west_locations(location)
