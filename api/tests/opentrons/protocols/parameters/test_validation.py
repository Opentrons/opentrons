import pytest
from typing import Optional, List

from opentrons.protocols.parameters.types import (
    AllowedTypes,
    ParameterChoice,
    ParameterNameError,
    ParameterValueError,
    ParameterDefinitionError,
)

from opentrons.protocols.parameters import validation as subject


def test_ensure_display_name() -> None:
    """It should ensure the display name is within the character limit."""
    result = subject.ensure_display_name("abc")
    assert result == "abc"


def test_ensure_display_name_raises() -> None:
    """It should raise if the display name is too long."""
    with pytest.raises(ParameterNameError):
        subject.ensure_display_name("Lorem ipsum dolor sit amet nam.")


def test_ensure_description_name() -> None:
    """It should ensure the description name is within the character limit."""
    result = subject.ensure_description("123456789")
    assert result == "123456789"


def test_ensure_description_raises() -> None:
    """It should raise if the description is too long."""
    with pytest.raises(ParameterNameError):
        subject.ensure_description(
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            " Fusce eget elementum nunc, quis sodales sed."
        )


def test_ensure_unit_string_length() -> None:
    """It should ensure the unit name is within the character limit."""
    result = subject.ensure_unit_string_length("ul")
    assert result == "ul"


def test_ensure_unit_string_length_raises() -> None:
    """It should raise if the unit name is too long."""
    with pytest.raises(ParameterNameError):
        subject.ensure_unit_string_length("newtons per square foot")


@pytest.mark.parametrize(
    "variable_name",
    [
        "x",
        "my_cool_variable",
        "_secret_variable",
    ],
)
def test_ensure_variable_name(variable_name: str) -> None:
    """It should ensure the variable name is a valid python variable name."""
    result = subject.ensure_variable_name(variable_name)
    assert result == variable_name


@pytest.mark.parametrize(
    "variable_name",
    [
        "3d_vector",
        "my cool variable name",
        "ca$h_money",
    ],
)
def test_ensure_variable_name_raises(variable_name: str) -> None:
    """It should raise if the variable name is not valid."""
    with pytest.raises(ParameterNameError, match="underscore"):
        subject.ensure_variable_name(variable_name)


@pytest.mark.parametrize(
    "variable_name",
    [
        "def",
        "class",
        "lambda",
    ],
)
def test_ensure_variable_name_raises_keyword(variable_name: str) -> None:
    """It should raise if the variable name is a python keyword."""
    with pytest.raises(ParameterNameError, match="keyword"):
        subject.ensure_variable_name(variable_name)


def test_validate_options() -> None:
    """It should not raise when given valid constraints"""
    subject.validate_options(123, 1, 100, None, int)
    subject.validate_options(
        123, None, None, [{"display_name": "abc", "value": 456}], int
    )
    subject.validate_options(12.3, 1.1, 100.9, None, float)
    subject.validate_options(
        12.3, None, None, [{"display_name": "abc", "value": 45.6}], float
    )
    subject.validate_options(
        True, None, None, [{"display_name": "abc", "value": False}], bool
    )
    subject.validate_options(
        "x", None, None, [{"display_name": "abc", "value": "y"}], str
    )


def test_validate_options_raises_value_error() -> None:
    """It should raise if the value of the default does not match the type."""
    with pytest.raises(ParameterValueError):
        subject.validate_options(123, 1, 100, None, str)


def test_validate_options_raises_name_error() -> None:
    """It should raise if the display name of a choice is too long."""
    with pytest.raises(ParameterNameError):
        subject.validate_options(
            "foo",
            None,
            None,
            [{"display_name": "Lorem ipsum dolor sit amet nam.", "value": "a"}],
            str,
        )


@pytest.mark.parametrize(
    ["default", "minimum", "maximum", "choices", "parameter_type", "error_text"],
    [
        (123, None, None, None, int, "provide either"),
        (
            123,
            1,
            None,
            [{"display_name": "abc", "value": 123}],
            int,
            "maximum values cannot",
        ),
        (
            123,
            None,
            100,
            [{"display_name": "abc", "value": 123}],
            int,
            "maximum values cannot",
        ),
        (123, None, None, [{"display_name": "abc"}], int, "dictionary with keys"),
        (123, None, None, [{"value": 123}], int, "dictionary with keys"),
        (
            123,
            None,
            None,
            [{"display_name": "abc", "value": "123"}],
            int,
            "must match type",
        ),
        (123, 1, None, None, int, "maximum must also"),
        (123, None, 100, None, int, "minimum must also"),
        (123, 100, 1, None, int, "Maximum must be greater"),
        (123, 1.1, 100, None, int, "Minimum and maximum must match type"),
        (123, 1, 100.5, None, int, "Minimum and maximum must match type"),
        (123, "1", "100", None, int, "Only parameters of type float or int"),
    ],
)
def test_validate_options_raise_definition_error(
    default: AllowedTypes,
    minimum: Optional[AllowedTypes],
    maximum: Optional[AllowedTypes],
    choices: Optional[List[ParameterChoice]],
    parameter_type: type,
    error_text: str,
) -> None:
    """It should raise if the parameter definition constraints are not valid."""
    with pytest.raises(ParameterDefinitionError, match=error_text):
        subject.validate_options(default, minimum, maximum, choices, parameter_type)
