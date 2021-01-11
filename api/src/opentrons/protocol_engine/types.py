"""Base protocol engine types and interfaces."""
from enum import Enum
from pydantic.dataclasses import dataclass
from typing import Union, Tuple
from typing_extensions import final

from opentrons.types import DeckSlotName


@final
@dataclass(frozen=True)
class DeckSlotLocation:
    """Location for labware placed in a single slot."""

    slot: DeckSlotName


LabwareLocation = Union[DeckSlotLocation]
"""Union of all legal labware locations."""


@final
class WellOrigin(str, Enum):
    """Origin of WellLocation offset."""

    TOP = "top"
    BOTTOM = "bottom"


@final
@dataclass(frozen=True)
class WellLocation:
    """A relative location in reference to a well's location."""

    origin: WellOrigin = WellOrigin.TOP
    offset: Tuple[float, float, float] = (0, 0, 0)


@dataclass(frozen=True)
class DeckLocation:
    """A symbolic reference to a location on the deck.

    Specified as the pipette, labware, and well. A `DeckLocation` may be
    combined with a `WellLocation` to produce an absolute position in deck
    coordinates.
    """

    pipette_id: str
    labware_id: str
    well_name: str
