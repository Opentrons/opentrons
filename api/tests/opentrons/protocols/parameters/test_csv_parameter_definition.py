"""Tests for the CSV Parameter Definitions."""

import inspect

import pytest
from decoy import Decoy

from opentrons.protocol_engine.types import CSVParameter, FileInfo
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parameters import validation as mock_validation
from opentrons.protocols.parameters.csv_parameter_definition import (
    CSVParameterDefinition,
    create_csv_parameter,
)
from opentrons.protocols.parameters.exceptions import RuntimeParameterRequired


@pytest.fixture(autouse=True)
def _patch_parameter_validation(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture
def api_version() -> APIVersion:
    """The API version under test."""
    return MAX_SUPPORTED_VERSION


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
    assert result.file_info is None


def test_set_csv_value(
    decoy: Decoy, csv_parameter_subject: CSVParameterDefinition
) -> None:
    """It should set the CSV parameter value to a byte string."""
    csv_parameter_subject.value = b"123"
    assert csv_parameter_subject.value == b"123"


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

    csv_parameter_subject.file_info = FileInfo(id="123", name="abc")
    result = csv_parameter_subject.as_protocol_engine_type()
    assert result == CSVParameter(
        displayName="My cool CSV",
        variableName="my_cool_csv",
        description="Comma Separated Value",
        file=FileInfo(id="123", name="abc"),
    )


def test_csv_parameter_as_csv_parameter_interface(
    api_version: APIVersion,
    csv_parameter_subject: CSVParameterDefinition,
) -> None:
    """It should return the CSV parameter interface for use in a protocol run context."""
    result = csv_parameter_subject.as_csv_parameter_interface(api_version)
    with pytest.raises(RuntimeParameterRequired):
        result.file

    csv_parameter_subject.value = b"abc"
    result = csv_parameter_subject.as_csv_parameter_interface(api_version)
    assert result.contents == "abc"
