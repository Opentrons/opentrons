"""Tests for the ParameterContext public interface."""
import inspect

import pytest
from decoy import Decoy

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
)
from opentrons.protocols.parameters import (
    parameter_definition as mock_parameter_definition,
)
from opentrons.protocol_api._parameter_context import ParameterContext


@pytest.fixture(autouse=True)
def _mock_parameter_definition_creates(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(mock_parameter_definition, inspect.isfunction):
        monkeypatch.setattr(mock_parameter_definition, name, decoy.mock(func=func))


@pytest.fixture
def api_version() -> APIVersion:
    """The API version under test."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(api_version: APIVersion) -> ParameterContext:
    """Get a ParameterContext test subject."""
    return ParameterContext(api_version=api_version)


def test_add_int(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add an int parameter definition."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(
        mock_parameter_definition.create_int_parameter(
            display_name="abc",
            variable_name="xyz",
            default=123,
            minimum=45,
            maximum=678,
            choices=[{"display_name": "foo", "value": 42}],
            description="blah blah blah",
            unit="foot candles",
        )
    ).then_return(param_def)
    subject.add_int(
        display_name="abc",
        variable_name="xyz",
        default=123,
        minimum=45,
        maximum=678,
        choices=[{"display_name": "foo", "value": 42}],
        description="blah blah blah",
        unit="foot candles",
    )
    assert param_def in subject._parameters


def test_add_float(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a float parameter definition."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(
        mock_parameter_definition.create_float_parameter(
            display_name="abc",
            variable_name="xyz",
            default=12.3,
            minimum=4.5,
            maximum=67.8,
            choices=[{"display_name": "foo", "value": 4.2}],
            description="blah blah blah",
            unit="lux",
        )
    ).then_return(param_def)
    subject.add_float(
        display_name="abc",
        variable_name="xyz",
        default=12.3,
        minimum=4.5,
        maximum=67.8,
        choices=[{"display_name": "foo", "value": 4.2}],
        description="blah blah blah",
        unit="lux",
    )
    assert param_def in subject._parameters


def test_add_bool(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a boolean parameter definition."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(
        mock_parameter_definition.create_bool_parameter(
            display_name="cba",
            variable_name="zxy",
            default=False,
            choices=[
                {"display_name": "On", "value": True},
                {"display_name": "Off", "value": False},
            ],
            description="lorem ipsum",
        )
    ).then_return(param_def)
    subject.add_bool(
        display_name="cba",
        variable_name="zxy",
        default=False,
        description="lorem ipsum",
    )
    assert param_def in subject._parameters


def test_add_string(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a string parameter definition."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(
        mock_parameter_definition.create_str_parameter(
            display_name="jkl",
            variable_name="qwerty",
            default="asdf",
            choices=[{"display_name": "bar", "value": "aaa"}],
            description="fee foo fum",
        )
    ).then_return(param_def)
    subject.add_str(
        display_name="jkl",
        variable_name="qwerty",
        default="asdf",
        choices=[{"display_name": "bar", "value": "aaa"}],
        description="fee foo fum",
    )
    assert param_def in subject._parameters
