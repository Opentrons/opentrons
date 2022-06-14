"""Check a deck layout for conflicts."""
# TODO(mc, 2022-06-15): decouple this interface from DeckItem
# (and ModuleGeometry) so it can be used in ProtocolEngine
from typing import Dict, List, Mapping, NamedTuple, Optional, Union
from typing_extensions import Final

from opentrons.protocol_api.labware import Labware
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)

from .deck_item import DeckItem


FIXED_TRASH_SLOT: Final = 12


class _NotAllowed(NamedTuple):
    """Nothing is allowed in this slot."""

    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return False


class _MaxHeight(NamedTuple):
    """Nothing over a certain height is allowed in this slot."""

    source_item: DeckItem
    source_location: int
    max_height: float
    max_tip_rack_height: float

    def is_allowed(self, item: DeckItem) -> bool:
        height_limit = (
            self.max_tip_rack_height
            if (isinstance(item, AbstractLabware) and item.is_tiprack())
            else self.max_height
        )

        return item.highest_z < height_limit


class _NoModule(NamedTuple):
    """A module is not allowed in this slot."""

    source_item: DeckItem
    source_location: int

    def is_allowed(self, item: DeckItem) -> bool:
        return not isinstance(item, ModuleGeometry)


class _OnlyTrash(NamedTuple):
    """Only fixed-trash labware is allowed in this slot."""

    source_location: int = FIXED_TRASH_SLOT

    def is_allowed(self, item: DeckItem) -> bool:
        if isinstance(item, AbstractLabware):
            return "fixedTrash" in item.get_quirks()
        if isinstance(item, Labware):
            return "fixedTrash" in item.quirks

        return False


_DeckRestriction = Union[_NotAllowed, _MaxHeight, _NoModule, _OnlyTrash]
"""A restriction on what is allowed in a given slot."""


class DeckConflictError(ValueError):
    """Adding an item to the deck would cause a conflict."""


class DeckItemConflictError(DeckConflictError):
    """Adding an item to the deck would conflict with an existing item."""

    def __init__(
        self,
        new_item: DeckItem,
        new_location: int,
        existing_item: DeckItem,
        existing_location: int,
    ) -> None:
        super().__init__(
            f"{existing_item.load_name} in slot {existing_location}"
            f" prevents {new_item.load_name} from using slot {new_location}."
        )


def check(
    existing_items: Mapping[int, DeckItem],
    new_item: DeckItem,
    new_location: int,
) -> None:
    """Check a deck layout for conflicts.

    Args:
        items: A list of location, item tuples to check.

    Raises:
        DeckConflictError: The given layout has at least one conflict.
    """
    restrictions: Dict[int, _DeckRestriction] = {FIXED_TRASH_SLOT: _OnlyTrash()}

    # build restrictions driven by existing items
    for location, item in existing_items.items():
        restrictions = _create_restrictions(
            item=item,
            location=location,
            existing_restrictions=restrictions,
        )

    # check new item against existing restrictions
    _check_restrictions(
        new_item=new_item,
        new_location=new_location,
        restrictions=restrictions,
    )

    # check new restrictions required by new item
    # do not interfere with existing items
    _create_restrictions(
        item=new_item,
        location=new_location,
        existing_items=existing_items,
        existing_restrictions=restrictions,
    )


def _create_restrictions(
    item: DeckItem,
    location: int,
    existing_restrictions: Mapping[int, _DeckRestriction],
    existing_items: Optional[Mapping[int, DeckItem]] = None,
) -> Dict[int, _DeckRestriction]:
    restrictions = dict(existing_restrictions)
    existing_items = existing_items or {}

    if location != FIXED_TRASH_SLOT:
        restrictions[location] = _create_not_allowed_restriction(
            existing_items=existing_items,
            restriction_location=location,
            source_item=item,
            source_location=location,
        )

    if isinstance(item, ThermocyclerGeometry):
        for covered_location in item.covered_slots:
            restrictions[covered_location] = _create_not_allowed_restriction(
                existing_items=existing_items,
                restriction_location=covered_location,
                source_item=item,
                source_location=location,
            )

    if isinstance(item, HeaterShakerGeometry):
        for covered_location in _get_east_west_locations(location):
            restrictions[covered_location] = _create_max_height_restriction(
                existing_items=existing_items,
                restriction_location=covered_location,
                source_item=item,
                source_location=location,
                max_height=item.MAX_ADJACENT_ITEM_HEIGHT,
                max_tip_rack_height=item.MAX_ADJACENT_TIP_RACK_HEIGHT,
            )

        for covered_location in _get_north_south_locations(location):
            restrictions[covered_location] = _create_no_module_restriction(
                existing_items=existing_items,
                restriction_location=covered_location,
                source_item=item,
                source_location=location,
            )

    return restrictions


def _check_restrictions(
    new_item: DeckItem,
    new_location: int,
    restrictions: Dict[int, _DeckRestriction],
) -> None:
    restriction = restrictions.get(new_location, None)

    if restriction is not None and not restriction.is_allowed(new_item):
        if isinstance(restriction, _OnlyTrash):
            raise DeckConflictError(
                f"Only fixed-trash is allowed in slot {restriction.source_location}"
            )
        else:
            raise DeckItemConflictError(
                new_item,
                new_location,
                restriction.source_item,
                restriction.source_location,
            )


def _create_not_allowed_restriction(
    existing_items: Mapping[int, DeckItem],
    restriction_location: int,
    source_item: DeckItem,
    source_location: int,
) -> _NotAllowed:
    restriction = _NotAllowed(source_item=source_item, source_location=source_location)
    existing_item = existing_items.get(restriction_location)

    if existing_item is not None and not restriction.is_allowed(existing_item):
        raise DeckItemConflictError(
            new_item=source_item,
            new_location=source_location,
            existing_item=existing_items[restriction_location],
            existing_location=restriction_location,
        )

    return restriction


def _create_max_height_restriction(
    existing_items: Mapping[int, DeckItem],
    restriction_location: int,
    source_item: DeckItem,
    source_location: int,
    max_height: float,
    max_tip_rack_height: float,
) -> _MaxHeight:
    restriction = _MaxHeight(
        source_item=source_item,
        source_location=source_location,
        max_height=max_height,
        max_tip_rack_height=max_tip_rack_height,
    )
    existing_item = existing_items.get(restriction_location)

    if existing_item is not None and not restriction.is_allowed(existing_item):
        raise DeckItemConflictError(
            new_item=source_item,
            new_location=source_location,
            existing_item=existing_items[restriction_location],
            existing_location=restriction_location,
        )

    return restriction


def _create_no_module_restriction(
    existing_items: Mapping[int, DeckItem],
    restriction_location: int,
    source_item: DeckItem,
    source_location: int,
) -> _NoModule:
    restriction = _NoModule(source_item=source_item, source_location=source_location)
    existing_item = existing_items.get(restriction_location)

    if existing_item is not None and not restriction.is_allowed(existing_item):
        raise DeckItemConflictError(
            new_item=source_item,
            new_location=source_location,
            existing_item=existing_items[restriction_location],
            existing_location=restriction_location,
        )

    return restriction


def _get_east_west_locations(location: int) -> List[int]:
    if location in [1, 4, 7, 10]:
        return [location + 1]
    elif location in [2, 5, 8, 11]:
        return [location - 1, location + 1]
    else:
        return [location - 1]


def _get_north_south_locations(location: int) -> List[int]:
    if location in [1, 2, 3]:
        return [location + 3]
    elif location in [4, 5, 6, 7, 8, 9]:
        return [location - 3, location + 3]
    else:
        return [location - 3]
