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
