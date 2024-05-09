"""Tests to ensure that the deck configuration is generated correctly."""

from pathlib import Path
from hypothesis import given, settings, HealthCheck
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategy.deck_configuration_strategies import (
    a_deck_configuration_with_invalid_fixture_in_col_2,
)
from test_data_generation.python_protocol_generation.python_protocol_generator import (
    PythonProtocolGenerator,
)


@given(deck_config=a_deck_configuration_with_invalid_fixture_in_col_2())
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_invalid_fixture_in_col_2(
    deck_config: DeckConfiguration, tmp_path: Path
) -> None:
    """I hypothesize, that any deck configuration that contains at least one, Heater-Shaker, Trash Bin, or Temperature module, in column 2 is invalid."""
    protocol_content = PythonProtocolGenerator(deck_config, "2.18").generate_protocol()
    print(protocol_content)
