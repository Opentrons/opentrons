"""Tests to ensure that the deck configuration is generated correctly."""

from pathlib import Path
import os
import pytest
import typing
from hypothesis import HealthCheck, given, settings
from tests.protocol_analysis_validator import (
    ProtocolAnalysisValidator,
)

from test_data_generation.python_protocol_generation.strategy.python_protocol_generation_strategies import (
    a_protocol_that_loads_invalid_stuff_into_column_2,
    a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_3,
    a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_4,
    a_protocol_that_tries_to_load_something_on_top_of_thermocycler,
    a_protocol_that_tries_to_load_something_on_top_of_a_waste_chute,
)

from test_data_generation.constants import ECHO_ANALYSIS_RESULTS_ENV_VAR_NAME

SHOULD_ECHO_ANALYSIS_RESULTS = ECHO_ANALYSIS_RESULTS_ENV_VAR_NAME in os.environ

if typing.TYPE_CHECKING:
    from test_data_generation.python_protocol_generation.protocol_configuration import (
        ProtocolConfiguration,
    )


@given(protocol_configuration=a_protocol_that_loads_invalid_stuff_into_column_2())
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_fixture_in_col_2(
    protocol_configuration: "ProtocolConfiguration", tmp_path: Path
) -> None:
    """I hypothesize, that any deck configuration that contains at least one, Heater-Shaker, Trash Bin, or Temperature module, in column 2 is invalid."""
    await ProtocolAnalysisValidator(
        protocol_configuration, tmp_path, SHOULD_ECHO_ANALYSIS_RESULTS
    ).expect_error()


@given(
    protocol_configuration=a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_3()
)
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_stuff_in_staging_area_col3(
    protocol_configuration: "ProtocolConfiguration", tmp_path: Path
) -> None:
    """I hypothesize, that any protocol that loads a trash bin, heater-shaker module, or temperature module into slot 3 on a staging area will fail analysis."""
    await ProtocolAnalysisValidator(
        protocol_configuration, tmp_path, SHOULD_ECHO_ANALYSIS_RESULTS
    ).expect_error()


@given(
    protocol_configuration=a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_4()
)
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_stuff_in_staging_area_col4(
    protocol_configuration: "ProtocolConfiguration", tmp_path: Path
) -> None:
    """I hypothesize, that any protocol that loads a trash bin, heater-shaker module, temperature module, or mag block module into slot 4 on a staging area will fail analysis."""
    await ProtocolAnalysisValidator(
        protocol_configuration, tmp_path, SHOULD_ECHO_ANALYSIS_RESULTS
    ).expect_error()


@given(
    protocol_configuration=a_protocol_that_tries_to_load_something_on_top_of_thermocycler()
)
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_stuff_on_thermocycler(
    protocol_configuration: "ProtocolConfiguration", tmp_path: Path
) -> None:
    """I hypothesize, that any protocol that tries to load a module, labware, or a trash bin on top of a thermocycler will fail analysis."""
    await ProtocolAnalysisValidator(
        protocol_configuration, tmp_path, SHOULD_ECHO_ANALYSIS_RESULTS
    ).expect_error()


@given(
    protocol_configuration=a_protocol_that_tries_to_load_something_on_top_of_a_waste_chute()
)
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@pytest.mark.asyncio
async def test_invalid_stuff_on_waste_chute(
    protocol_configuration: "ProtocolConfiguration", tmp_path: Path
) -> None:
    """I hypothesize, that any protocol that tries to load a module, trash bin or labware on top of a waste chute will fail analysis."""
    await ProtocolAnalysisValidator(
        protocol_configuration, tmp_path, SHOULD_ECHO_ANALYSIS_RESULTS
    ).expect_error()
