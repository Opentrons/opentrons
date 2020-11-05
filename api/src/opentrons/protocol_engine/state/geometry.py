"""Geometry state store and getters."""
from dataclasses import dataclass

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.types import Point

from .substore import Substore, CommandReactive


@dataclass
class GeometryState():
    """Geometry state and getters."""
    _deck_definition: DeckDefinitionV2

    def get_deck_definition(self) -> DeckDefinitionV2:
        return self._deck_definition

    def get_slot_position(self, slot: int) -> Point:
        deck_def = self.get_deck_definition()
        position = deck_def["locations"]["orderedSlots"][slot]["position"]

        return Point(x=position[0], y=position[1], z=position[2])


class GeometryStore(Substore[GeometryState], CommandReactive):
    """Geometry state store container class."""

    def __init__(self, deck_definition: DeckDefinitionV2) -> None:
        """Initialize a geometry store and its state."""
        self._state = GeometryState(_deck_definition=deck_definition)
