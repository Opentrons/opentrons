"""Tests to ensure that the deck configuration is generated correctly."""

import pytest
from hypothesis import given, settings, HealthCheck
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategies import an_invalid_deck

unique_values = set()


@pytest.fixture
def print_unique_values():
    yield
    print("\n\nNUMBER OF UNIQUE EXAMPLES: ", len(unique_values))


@given(deck=an_invalid_deck())
@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.filter_too_much, HealthCheck.too_slow],
)
@pytest.mark.usefixtures("print_unique_values")
def test_invalid_deck(deck: DeckConfiguration) -> None:
    """Test that a invalid deck is generated."""
    global unique_values
    unique_values.add(deck)
    print(deck)
