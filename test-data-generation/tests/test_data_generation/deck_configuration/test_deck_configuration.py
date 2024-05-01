"""Tests to ensure that the deck configuration is generated correctly."""

from hypothesis import given, settings, HealthCheck
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategy.final_strategies import (
    a_deck_configuration_with_a_module_or_trash_slot_above_or_below_a_heater_shaker,
    a_deck_configuration_with_invalid_fixture_in_col_2,
)

NUM_EXAMPLES = 100


@given(
    deck_config=a_deck_configuration_with_a_module_or_trash_slot_above_or_below_a_heater_shaker()
)
@settings(
    max_examples=NUM_EXAMPLES,
    suppress_health_check=[HealthCheck.filter_too_much, HealthCheck.too_slow],
)
def test_above_below_heater_shaker(deck_config: DeckConfiguration) -> None:
    """I hypothesize, that any deck configuration with a non-labware slot fixture above or below a heater-shaker is invalid."""
    print(deck_config)

    # TODO: create protocol and run analysis

    # protocol = create_protocol(deck)
    # with pytest.assertRaises as e:
    #     analyze(protocol)
    # assert e.exception == "Some statement about the deck configuration being invalid because of the labware above or below the Heater-Shaker"


@given(deck_config=a_deck_configuration_with_invalid_fixture_in_col_2())
@settings(
    max_examples=NUM_EXAMPLES,
    suppress_health_check=[HealthCheck.filter_too_much, HealthCheck.too_slow],
)
def test_invalid_fixture_in_col_2(deck_config: DeckConfiguration) -> None:
    """I hypothesize, that any deck configuration that contains at least one, Heater-Shaker, Trash Bin, or Temperature module, in column 2 is invalid."""
    print(deck_config)

    # TODO: Same as above
