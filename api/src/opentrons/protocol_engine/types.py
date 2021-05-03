"""Base protocol engine types and interfaces."""
from enum import Enum
from dataclasses import dataclass
from pydantic import BaseModel
from typing import Union, Tuple
from typing_extensions import final

from opentrons.types import DeckSlotName


class DeckSlotLocation(BaseModel):
    """Location for labware placed in a single slot."""

    slot: DeckSlotName


LabwareLocation = Union[DeckSlotLocation]
"""Union of all legal labware locations."""


@final
class WellOrigin(str, Enum):
    """Origin of WellLocation offset."""

    TOP = "top"
    BOTTOM = "bottom"


class WellLocation(BaseModel):
    """A relative location in reference to a well's location."""

    origin: WellOrigin = WellOrigin.TOP
    offset: Tuple[float, float, float] = (0, 0, 0)


class DeckLocation(BaseModel):
    """A symbolic reference to a location on the deck.

    Specified as the pipette, labware, and well. A `DeckLocation` may be
    combined with a `WellLocation` to produce an absolute position in deck
    coordinates.
    """

    pipette_id: str
    labware_id: str
    well_name: str


@final
@dataclass(frozen=True)
class Dimensions:
    """Dimensions of an object in deck-space."""

    x: float
    y: float
    z: float


# TODO(mc, 2021-04-16): reconcile with opentrons_shared_data
# shared-data/python/opentrons_shared_data/pipette/dev_types.py
class PipetteName(str, Enum):
    """Pipette load name values."""

    P10_SINGLE = "p10_single"
    P10_MULTI = "p10_multi"
    P20_SINGLE_GEN2 = "p20_single_gen2"
    P20_MULTI_GEN2 = "p20_multi_gen2"
    P50_SINGLE = "p50_single"
    P50_MULTI = "p50_multi"
    P300_SINGLE = "p300_single"
    P300_MULTI = "p300_multi"
    P300_SINGLE_GEN2 = "p300_single_gen2"
    P300_MULTI_GEN2 = "p300_multi_gen2"
    P1000_SINGLE = "p1000_single"
    P1000_SINGLE_GEN2 = "p1000_single_gen2"
