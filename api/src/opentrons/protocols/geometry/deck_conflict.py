"""Check a deck layout for conflicts."""
# TODO(mc, 2022-06-15): decouple this interface from DeckItem
# (and subclasses) so it can be used in ProtocolEngine
from typing import List, Mapping, NamedTuple, Optional, Union
from typing_extensions import Final

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_south_slot,
    get_adjacent_slots,
)
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.core.labware import AbstractLabware
from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)

from .deck_item import DeckItem


_FIXED_TRASH_SLOT: Final = 12


class _NothingAllowed(NamedTuple):
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
    """No module of any kind is allowed in this slot."""

    location: int
    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, ModuleGeometry)


class _NoHeaterShakerModule(NamedTuple):
    """No Heater-Shaker module is allowed in this slot."""

    location: int
    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, HeaterShakerGeometry)


class _FixedTrashOnly(NamedTuple):
    """Only fixed-trash labware is allowed in this slot."""

    location: int = _FIXED_TRASH_SLOT

    def is_allowed(self, item: DeckItem) -> bool:
        return _is_fixed_trash(item)


_DeckRestriction = Union[
    _NothingAllowed,
    _MaxHeight,
    _NoModule,
    _NoHeaterShakerModule,
    _FixedTrashOnly,
]
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
    restrictions: List[_DeckRestriction] = [_FixedTrashOnly()]

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
        # Disallow a different item from overlapping this item in this deck slot.
        restrictions.append(
            _NothingAllowed(
                location=location,
                source_item=item,
                source_location=location,
            )
        )

    if _is_fixed_trash(item):
        # A Heater-Shaker can't safely be placed just south of the fixed trash,
        # because the fixed trash blocks access to the screw that locks the
        # Heater-Shaker onto the deck.
        location_south_of_fixed_trash = get_south_slot(location)
        if location_south_of_fixed_trash is not None:
            restrictions.append(
                _NoHeaterShakerModule(
                    location=location_south_of_fixed_trash,
                    source_item=item,
                    source_location=location,
                )
            )

    if isinstance(item, ThermocyclerGeometry):
        for covered_location in item.covered_slots:
            restrictions.append(
                _NothingAllowed(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

    if isinstance(item, HeaterShakerGeometry):
        for covered_location in get_adjacent_slots(location):
            restrictions.append(
                _NoModule(
                    location=covered_location,
                    source_item=item,
                    source_location=location,
                )
            )

        for covered_location in get_east_west_slots(location):
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

    if isinstance(restriction, _FixedTrashOnly):
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


def _is_fixed_trash(item: DeckItem) -> bool:
    # `item` is inconsistently provided to us as an AbstractLabware or Labware.
    # See TODO comments in opentrons.protocols.geometry.deck,
    # the module that calls into this module.
    if isinstance(item, AbstractLabware):
        return "fixedTrash" in item.get_quirks()
    if isinstance(item, Labware):
        return "fixedTrash" in item.quirks
    return False
