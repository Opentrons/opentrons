"""Test state getters for retrieving geometry views of state."""
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.types import Point

from opentrons.protocol_engine.state import StateStore


def test_get_deck_definition(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should return the deck definition."""
    deck = store.geometry.get_deck_definition()

    assert deck == standard_deck_def


def test_get_slot_position(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should get the absolute location of a deck slot's origin."""
    point = store.geometry.get_slot_position(3)
    slot_pos = standard_deck_def["locations"]["orderedSlots"][3]["position"]

    assert point == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])
