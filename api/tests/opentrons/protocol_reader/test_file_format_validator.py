"""Tests for FileFormatValidator."""

import json

import pytest

from opentrons_shared_data import load_shared_data

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_reader.file_identifier import (
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
)
from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.file_format_validator import (
    FileFormatValidationError,
    FileFormatValidator,
)


@pytest.mark.parametrize(
    "schema_version, json_protocol_fixture_path",
    [
        (3, "protocol/fixtures/3/simple.json"),
        (4, "protocol/fixtures/4/simpleV4.json"),
        (5, "protocol/fixtures/5/simpleV5.json"),
        (6, "protocol/fixtures/6/simpleV6.json"),
        (7, "protocol/fixtures/7/simpleV7.json"),
    ],
)
async def test_valid_json_main_file(
    schema_version: int, json_protocol_fixture_path: str
) -> None:
    """It should not raise when given a valid JSON main file."""
    json_protocol_contents = json.loads(load_shared_data(json_protocol_fixture_path))
    input_file = IdentifiedJsonMain(
        unvalidated_json=json_protocol_contents,
        schema_version=schema_version,
        # These attributes should be ignored by the subject:
        original_file=BufferedFile(
            name="foo",
            contents=b"bar",
            path=None,
        ),
        robot_type="OT-2 Standard",
        metadata={},
    )
    subject = FileFormatValidator()
    await subject.validate([input_file])


async def test_valid_python_main_file() -> None:
    """Python main files should always pass validation.

    FileFormatValidator doesn't currently enforce anything beyond the parsing done in
    FileIdentifier.
    """
    input_file = IdentifiedPythonMain(
        original_file=BufferedFile(
            name="foo",
            contents=b"bar",
            path=None,
        ),
        # These attributes should be ignored by the subject:
        api_level=APIVersion(123, 456),
        robot_type="OT-2 Standard",
        metadata={},
    )
    subject = FileFormatValidator()
    await subject.validate([input_file])


@pytest.mark.parametrize(
    "identified_schema_version",
    range(3, 8),
)
async def test_invalid_json_main(identified_schema_version: int) -> None:
    """It should raise when non-conforming JSON is provided as a main file."""
    input_file = IdentifiedJsonMain(
        unvalidated_json={"this_does_not_conform_to_any_opentrons_schema": True},
        schema_version=identified_schema_version,
        # These attributes should be ignored by the subject:
        original_file=BufferedFile(
            name="foo",
            contents=b"bar",
            path=None,
        ),
        robot_type="OT-2 Standard",
        metadata={},
    )
    subject = FileFormatValidator()
    with pytest.raises(
        FileFormatValidationError, match="foo could not be read as a JSON protocol."
    ):
        await subject.validate([input_file])


async def test_invalid_labware_definition() -> None:
    """It should raise when non-conforming JSON is provided as a labware file."""
    input_file = IdentifiedLabwareDefinition(
        original_file=BufferedFile(
            name="foo",
            contents=b"bar",
            path=None,
        ),
        unvalidated_json={"this_does_not_conform_to_any_opentrons_schema": True},
    )
    subject = FileFormatValidator()
    with pytest.raises(
        FileFormatValidationError,
        match="foo could not be read as a labware definition.",
    ):
        await subject.validate([input_file])
