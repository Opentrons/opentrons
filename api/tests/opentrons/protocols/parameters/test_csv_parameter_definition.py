"""Tests for the CSV Parameter Definitions."""
import inspect
from io import TextIOWrapper

import pytest
from decoy import Decoy

from opentrons.protocol_engine.types import CSVParameter, FileId
from opentrons.protocols.parameters import validation as mock_validation
from opentrons.protocols.parameters.csv_parameter_definition import (
    create_csv_parameter,
    CSVParameterDefinition,
)
from opentrons.protocols.parameters.types import ParameterDefinitionError


@pytest.fixture(autouse=True)
def _patch_parameter_validation(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture
def csv_parameter_subject(decoy: Decoy) -> CSVParameterDefinition:
    """Return a CSV Parameter Definition subject."""
    decoy.when(mock_validation.ensure_display_name("abc")).then_return("My cool CSV")
    decoy.when(mock_validation.ensure_variable_name("def")).then_return("my_cool_csv")
    decoy.when(mock_validation.ensure_description("ghi")).then_return(
        "Comma Separated Value"
    )
    return create_csv_parameter(
        display_name="abc", variable_name="def", description="ghi"
    )


def test_create_csv_parameter(decoy: Decoy) -> None:
    """It should create a CSV parameter"""
    decoy.when(mock_validation.ensure_display_name("abc")).then_return("My cool CSV")
    decoy.when(mock_validation.ensure_variable_name("def")).then_return("my_cool_csv")
    decoy.when(mock_validation.ensure_description("ghi")).then_return(
        "Comma Separated Value"
    )
    result = create_csv_parameter(
        display_name="abc", variable_name="def", description="ghi"
    )

    assert result._display_name == "My cool CSV"
    assert result.variable_name == "my_cool_csv"
    assert result._description == "Comma Separated Value"
    assert result.value is None
    assert result.id is None


def test_set_csv_value(
    decoy: Decoy, csv_parameter_subject: CSVParameterDefinition
) -> None:
    """It should set the CSV parameter value to a file."""
    mock_file = decoy.mock(cls=TextIOWrapper)
    decoy.when(mock_file.name).then_return("mock.csv")

    csv_parameter_subject.value = mock_file
    assert csv_parameter_subject.value is mock_file


def test_set_csv_value_raises(
    decoy: Decoy, csv_parameter_subject: CSVParameterDefinition
) -> None:
    """It should raise if the file set to does not end in '.csv'."""
    mock_file = decoy.mock(cls=TextIOWrapper)
    decoy.when(mock_file.name).then_return("mock.txt")

    with pytest.raises(ParameterDefinitionError):
        csv_parameter_subject.value = mock_file


def test_csv_parameter_as_protocol_engine_type(
    csv_parameter_subject: CSVParameterDefinition,
) -> None:
    """It should return the CSV parameter as a protocol engine type for sending to client."""
    result = csv_parameter_subject.as_protocol_engine_type()
    assert result == CSVParameter(
        displayName="My cool CSV",
        variableName="my_cool_csv",
        description="Comma Separated Value",
        file=None,
    )

    csv_parameter_subject.id = "123abc"
    result = csv_parameter_subject.as_protocol_engine_type()
    assert result == CSVParameter(
        displayName="My cool CSV",
        variableName="my_cool_csv",
        description="Comma Separated Value",
        file=FileId(id="123abc"),
    )
