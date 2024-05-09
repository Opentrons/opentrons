"""Tests to ensure that the deck configuration is generated correctly."""

from pathlib import Path

import pytest
from hypothesis import HealthCheck, given, note, settings
from tests.utils import has_errors, make_the_failed_protocol_pretty, run_analysis

from test_data_generation.datashapes import DeckConfiguration
from test_data_generation.deck_configuration.strategy.deck_configuration_strategies import (
    a_deck_configuration_with_invalid_fixture_in_col_2,
)
from test_data_generation.python_protocol_generation.python_protocol_generator import (
    PythonProtocolGenerator,
)
from test_data_generation.python_protocol_generation.strategy.python_protocol_generation_strategies import (
    a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_3,
    a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_4,
)


@given(deck_config=a_deck_configuration_with_invalid_fixture_in_col_2())
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_fixture_in_col_2(
    deck_config: DeckConfiguration, tmp_path: Path
) -> None:
    """I hypothesize, that any deck configuration that contains at least one, Heater-Shaker, Trash Bin, or Temperature module, in column 2 is invalid."""
    protocol_content = PythonProtocolGenerator(deck_config, "2.18").generate_protocol()
    analysis_response = await run_analysis(protocol_content, tmp_path)
    note(str(deck_config))
    assert has_errors(
        analysis_response
    ), "This deck configuration should cause analysis to fail."
