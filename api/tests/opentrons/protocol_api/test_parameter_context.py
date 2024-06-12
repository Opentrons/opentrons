"""Tests for the ParameterContext public interface."""
import inspect

import pytest
from decoy import Decoy

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
)
from opentrons.protocols.parameters import (
    csv_parameter_definition as mock_csv_parameter_definition,
    parameter_definition as mock_parameter_definition,
    validation as mock_validation,
)
from opentrons.protocols.parameters.types import ParameterDefinitionError
from opentrons.protocol_engine.types import BooleanParameter

from opentrons.protocol_api._parameter_context import ParameterContext


@pytest.fixture(autouse=True)
def _mock_parameter_definition_creates(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(mock_parameter_definition, inspect.isfunction):
        monkeypatch.setattr(mock_parameter_definition, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_csv_parameter_definition_creates(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(
        mock_csv_parameter_definition, inspect.isfunction
    ):
        monkeypatch.setattr(mock_csv_parameter_definition, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _patch_parameter_validation(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


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
    subject._parameters["other_param"] = decoy.mock(
        cls=mock_parameter_definition.ParameterDefinition
    )
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def.variable_name).then_return("my cool variable")
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

    assert param_def is subject._parameters["my cool variable"]
    decoy.verify(mock_validation.validate_variable_name_unique("xyz", {"other_param"}))


def test_add_float(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a float parameter definition."""
    subject._parameters["other_param"] = decoy.mock(
        cls=mock_parameter_definition.ParameterDefinition
    )
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def.variable_name).then_return("my cooler variable")
    decoy.when(mock_validation.ensure_float_value(12.3)).then_return(3.21)
    decoy.when(mock_validation.ensure_optional_float_value(4.5)).then_return(5.4)
    decoy.when(mock_validation.ensure_optional_float_value(67.8)).then_return(87.6)
    decoy.when(
        mock_validation.ensure_float_choices([{"display_name": "foo", "value": 4.2}])
    ).then_return([{"display_name": "bar", "value": 2.4}])
    decoy.when(
        mock_parameter_definition.create_float_parameter(
            display_name="abc",
            variable_name="xyz",
            default=3.21,
            minimum=5.4,
            maximum=87.6,
            choices=[{"display_name": "bar", "value": 2.4}],
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

    assert param_def is subject._parameters["my cooler variable"]
    decoy.verify(mock_validation.validate_variable_name_unique("xyz", {"other_param"}))


def test_add_bool(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a boolean parameter definition."""
    subject._parameters["other_param"] = decoy.mock(
        cls=mock_parameter_definition.ParameterDefinition
    )
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def.variable_name).then_return("my coolest variable")
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

    assert param_def is subject._parameters["my coolest variable"]
    decoy.verify(mock_validation.validate_variable_name_unique("zxy", {"other_param"}))


def test_add_string(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a string parameter definition."""
    subject._parameters["other_param"] = decoy.mock(
        cls=mock_parameter_definition.ParameterDefinition
    )
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def.variable_name).then_return("my slightly less cool variable")
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

    assert param_def is subject._parameters["my slightly less cool variable"]
    decoy.verify(
        mock_validation.validate_variable_name_unique("qwerty", {"other_param"})
    )


def test_add_csv(decoy: Decoy, subject: ParameterContext) -> None:
    """It should create and add a CSV parameter definition."""
    subject._parameters["other_param"] = decoy.mock(
        cls=mock_csv_parameter_definition.CSVParameterDefinition
    )
    param_def = decoy.mock(cls=mock_csv_parameter_definition.CSVParameterDefinition)
    decoy.when(param_def.variable_name).then_return("my potentially cool variable")
    decoy.when(
        mock_csv_parameter_definition.create_csv_parameter(
            display_name="jkl",
            variable_name="qwerty",
            description="fee foo fum",
        )
    ).then_return(param_def)

    subject.add_csv_file(
        display_name="jkl",
        variable_name="qwerty",
        description="fee foo fum",
    )

    assert param_def is subject._parameters["my potentially cool variable"]
    decoy.verify(
        mock_validation.validate_variable_name_unique("qwerty", {"other_param"})
    )


def test_set_parameters(decoy: Decoy, subject: ParameterContext) -> None:
    """It should set the parameter values."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def.parameter_type).then_return(bool)
    decoy.when(mock_validation.ensure_value_type("bar", bool)).then_return("rhubarb")
    subject._parameters["foo"] = param_def

    subject.set_parameters({"foo": "bar"})

    assert param_def.value == "rhubarb"


def test_set_parameters_raises(decoy: Decoy, subject: ParameterContext) -> None:
    """It should raise if the given parameter is not defined."""
    with pytest.raises(ParameterDefinitionError):
        subject.set_parameters({"foo": "bar"})


def test_export_parameters_for_analysis(
    decoy: Decoy, subject: ParameterContext
) -> None:
    """It should export the parameters as protocol engine types."""
    param_def = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    boolean_param = decoy.mock(cls=BooleanParameter)
    decoy.when(param_def.as_protocol_engine_type()).then_return(boolean_param)
    subject._parameters["foo"] = param_def

    assert subject.export_parameters_for_analysis() == [boolean_param]


def test_export_parameters_for_protocol(
    decoy: Decoy, subject: ParameterContext
) -> None:
    """It should export the parameters as a Parameters object with the parameters as dynamic attributes."""
    param_def_1 = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    param_def_2 = decoy.mock(cls=mock_parameter_definition.ParameterDefinition)
    decoy.when(param_def_1.variable_name).then_return("x")
    decoy.when(param_def_1.value).then_return("a")
    decoy.when(param_def_2.variable_name).then_return("y")
    decoy.when(param_def_2.value).then_return(1.23)
    subject._parameters = {"foo": param_def_1, "bar": param_def_2}

    result = subject.export_parameters_for_protocol()
    assert result.x == "a"  # type: ignore[attr-defined]
    assert result.y == 1.23  # type: ignore[attr-defined]
