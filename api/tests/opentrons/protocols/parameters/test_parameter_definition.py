"""Tests for the Parameter Definitions."""

import inspect

import pytest
from decoy import Decoy

from opentrons.protocol_engine.types import (
    BooleanParameter,
    EnumChoice,
    EnumParameter,
    NumberParameter,
)
from opentrons.protocols.parameters import validation as mock_validation
from opentrons.protocols.parameters.exceptions import ParameterValueError
from opentrons.protocols.parameters.parameter_definition import (
    create_bool_parameter,
    create_float_parameter,
    create_int_parameter,
    create_str_parameter,
)


@pytest.fixture(autouse=True)
def _patch_parameter_validation(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


def test_create_int_parameter_min_and_max(decoy: Decoy) -> None:
    """It should create an int parameter definition with a minimum and maximum."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("a b c")).then_return("1 2 3")
    decoy.when(mock_validation.ensure_unit_string_length("test")).then_return("microns")

    parameter_def = create_int_parameter(
        display_name="foo",
        variable_name="bar",
        default=42,
        minimum=1,
        maximum=100,
        description="a b c",
        unit="test",
    )

    decoy.verify(
        mock_validation.validate_options(42, 1, 100, None, int),
        mock_validation.validate_type(42, int),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._description == "1 2 3"
    assert parameter_def._unit == "microns"
    assert parameter_def._allowed_values is None
    assert parameter_def._minimum == 1
    assert parameter_def._maximum == 100
    assert parameter_def.value == 42


def test_create_int_parameter_choices(decoy: Decoy) -> None:
    """It should create an int parameter definition with choices."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description(None)).then_return("1 2 3")
    decoy.when(mock_validation.ensure_unit_string_length(None)).then_return("microns")

    parameter_def = create_int_parameter(
        display_name="foo",
        variable_name="bar",
        default=42,
        choices=[{"display_name": "uhh", "value": 42}],
    )

    decoy.verify(
        mock_validation.validate_options(
            42, None, None, [{"display_name": "uhh", "value": 42}], int
        ),
        mock_validation.validate_type(42, int),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._description == "1 2 3"
    assert parameter_def._unit == "microns"
    assert parameter_def._allowed_values == {42}
    assert parameter_def._minimum is None
    assert parameter_def._maximum is None
    assert parameter_def.value == 42


def test_int_parameter_default_raises_not_in_range() -> None:
    """It should raise an error if the default is not between min or max"""
    with pytest.raises(ParameterValueError, match="between"):
        create_int_parameter(
            display_name="foo",
            variable_name="bar",
            default=9000,
            minimum=9001,
            maximum=10000,
        )


def test_create_float_parameter_min_and_max(decoy: Decoy) -> None:
    """It should create a float parameter definition with a minimum and maximum."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("a b c")).then_return("1 2 3")
    decoy.when(mock_validation.ensure_unit_string_length("test")).then_return("microns")

    parameter_def = create_float_parameter(
        display_name="foo",
        variable_name="bar",
        default=4.2,
        minimum=1.0,
        maximum=10.5,
        description="a b c",
        unit="test",
    )

    decoy.verify(
        mock_validation.validate_options(4.2, 1.0, 10.5, None, float),
        mock_validation.validate_type(4.2, float),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._description == "1 2 3"
    assert parameter_def._unit == "microns"
    assert parameter_def._allowed_values is None
    assert parameter_def._minimum == 1.0
    assert parameter_def._maximum == 10.5
    assert parameter_def.value == 4.2


def test_create_float_parameter_choices(decoy: Decoy) -> None:
    """It should create a float parameter definition with choices."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")

    parameter_def = create_float_parameter(
        display_name="foo",
        variable_name="bar",
        default=4.2,
        choices=[{"display_name": "urr", "value": 4.2}],
    )

    decoy.verify(
        mock_validation.validate_options(
            4.2, None, None, [{"display_name": "urr", "value": 4.2}], float
        ),
        mock_validation.validate_type(4.2, float),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._allowed_values == {4.2}
    assert parameter_def._minimum is None
    assert parameter_def._maximum is None
    assert parameter_def.value == 4.2


def test_float_parameter_default_raises_not_in_range() -> None:
    """It should raise an error if the default is not between min or max"""
    with pytest.raises(ParameterValueError, match="between"):
        create_float_parameter(
            display_name="foo",
            variable_name="bar",
            default=9000.1,
            minimum=1,
            maximum=9000,
        )


def test_create_bool_parameter(decoy: Decoy) -> None:
    """It should create a boolean parameter"""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("describe this")).then_return("1 2 3")

    parameter_def = create_bool_parameter(
        display_name="foo",
        variable_name="bar",
        default=False,
        choices=[{"display_name": "uhh", "value": False}],
        description="describe this",
    )

    decoy.verify(
        mock_validation.validate_options(
            False, None, None, [{"display_name": "uhh", "value": False}], bool
        ),
        mock_validation.validate_type(False, bool),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._description == "1 2 3"
    assert parameter_def._unit is None
    assert parameter_def._allowed_values == {False}
    assert parameter_def._minimum is None
    assert parameter_def._maximum is None
    assert parameter_def.value is False


def test_create_str_parameter(decoy: Decoy) -> None:
    """It should create a string parameter"""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("describe this")).then_return("1 2 3")

    parameter_def = create_str_parameter(
        display_name="foo",
        variable_name="bar",
        default="omega",
        choices=[{"display_name": "alpha", "value": "omega"}],
        description="describe this",
    )

    decoy.verify(
        mock_validation.validate_options(
            "omega", None, None, [{"display_name": "alpha", "value": "omega"}], str
        ),
        mock_validation.validate_type("omega", str),
    )

    assert parameter_def._display_name == "my cool name"
    assert parameter_def.variable_name == "my variable"
    assert parameter_def._description == "1 2 3"
    assert parameter_def._unit is None
    assert parameter_def._allowed_values == {"omega"}
    assert parameter_def._minimum is None
    assert parameter_def._maximum is None
    assert parameter_def.value == "omega"


def test_str_parameter_default_raises_not_in_allowed_values() -> None:
    """It should raise an error if the default is not between min or max"""
    with pytest.raises(ParameterValueError, match="allowed values"):
        create_str_parameter(
            display_name="foo",
            variable_name="bar",
            default="waldo",
            choices=[{"display_name": "where's", "value": "odlaw"}],
        )


def test_as_protocol_engine_boolean_parameter(decoy: Decoy) -> None:
    """It should return a protocol engine BooleanParameter model."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("describe this")).then_return("1 2 3")

    parameter_def = create_bool_parameter(
        display_name="foo",
        variable_name="bar",
        default=False,
        choices=[{"display_name": "uhh", "value": False}],
        description="describe this",
    )

    assert parameter_def.as_protocol_engine_type() == BooleanParameter(
        type="bool",
        displayName="my cool name",
        variableName="my variable",
        description="1 2 3",
        value=False,
        default=False,
    )


def test_as_protocol_engine_enum_parameter(decoy: Decoy) -> None:
    """It should return a protocol engine EnumParameter model."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")

    parameter_def = create_str_parameter(
        display_name="foo",
        variable_name="bar",
        default="red",
        choices=[
            {"display_name": "Lapis lazuli", "value": "blue"},
            {"display_name": "Vermilion", "value": "red"},
            {"display_name": "Celadon", "value": "green"},
        ],
    )
    parameter_def.value = "green"
    decoy.when(mock_validation.convert_type_string_for_enum(str)).then_return("float")

    assert parameter_def.as_protocol_engine_type() == EnumParameter(
        type="float",
        displayName="my cool name",
        variableName="my variable",
        choices=[
            EnumChoice(displayName="Lapis lazuli", value="blue"),
            EnumChoice(displayName="Vermilion", value="red"),
            EnumChoice(displayName="Celadon", value="green"),
        ],
        value="green",
        default="red",
    )


def test_as_protocol_engine_number_parameter(decoy: Decoy) -> None:
    """It should return a protocol engine NumberParameter model."""
    decoy.when(mock_validation.ensure_display_name("foo")).then_return("my cool name")
    decoy.when(mock_validation.ensure_variable_name("bar")).then_return("my variable")
    decoy.when(mock_validation.ensure_description("a b c")).then_return("1 2 3")
    decoy.when(mock_validation.ensure_unit_string_length("test")).then_return("microns")

    parameter_def = create_int_parameter(
        display_name="foo",
        variable_name="bar",
        default=42,
        minimum=1,
        maximum=100,
        description="a b c",
        unit="test",
    )

    parameter_def.value = 60
    decoy.when(mock_validation.convert_type_string_for_num_param(int)).then_return(
        "int"
    )

    assert parameter_def.as_protocol_engine_type() == NumberParameter(
        type="int",
        displayName="my cool name",
        variableName="my variable",
        description="1 2 3",
        suffix="microns",
        min=1.0,
        max=100.0,
        value=60.0,
        default=42.0,
    )
