"""Tests to ensure that the deck configuration is generated correctly."""

from hypothesis import given, settings
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategies import a_valid_deck


@given(deck=a_valid_deck())
@settings(max_examples=200)
def test_a_valid_deck(deck: DeckConfiguration) -> None:
    """Test that a valid deck is generated."""
    pass
