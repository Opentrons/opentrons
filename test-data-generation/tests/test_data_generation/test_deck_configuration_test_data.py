"""Examples of how to generate data for testing deck configuration."""

from hypothesis import given
from test_data_generation.deck_configuration_test_data import a_valid_deck, DeckConfiguration


@given(deck=a_valid_deck())
def test_a_valid_deck(deck: DeckConfiguration) -> None:
    """Test that a valid deck is generated."""
    assert deck is not None
    assert len(deck.A) == 3 or 4
