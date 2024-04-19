from hypothesis import given, settings
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategies import a_valid_deck

@given(deck=a_valid_deck())
@settings(max_examples=200)
def test_a_valid_deck(deck: DeckConfiguration) -> None:
    """Test that a valid deck is generated."""
    assert deck is not None
    assert len(deck.A) == 3 or 4
    for row in deck.rows:
        if row.col4 is not None:
            assert not row.col4.is_a_module()
        if row.col4 is not None:
            assert not row.col3.is_a_module()