"""Base protocol engine types and interfaces."""
from pydantic.dataclasses import dataclass
from typing import Union
from typing_extensions import final

from opentrons.types import DeckSlotName


@final
@dataclass(frozen=True)
class DeckSlotLocation:
    """Location for labware placed in a single slot."""
    slot: DeckSlotName


LabwareLocation = Union[DeckSlotLocation]
"""Union of all legal labware locations."""
