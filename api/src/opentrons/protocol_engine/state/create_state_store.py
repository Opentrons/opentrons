"""StateStore and dependency factory."""
from ..resources import DeckDataProvider
from .state import StateStore


async def create_state_store() -> StateStore:
    """Create a ready-to-use StateStore instance."""
    deck_data = DeckDataProvider()

    # TODO(mc, 2020-11-18): check short trash FF
    deck_definition = await deck_data.get_deck_definition()
    deck_fixed_labware = await deck_data.get_deck_fixed_labware(deck_definition)

    return StateStore(
        deck_definition=deck_definition,
        deck_fixed_labware=deck_fixed_labware,
    )
