# noqa: D100

from json import dumps as json_dumps
from pathlib import Path
from textwrap import dedent

import pytest

from opentrons.protocols.models.json_protocol import (
    Metadata as JsonProtocolMetadata,
    make_minimal as make_minimal_json_protocol,
)

from opentrons.protocol_runner.pre_analysis import (
    PreAnalyzer,
    JsonPreAnalysis,
    PythonPreAnalysis,
    Metadata as ExtractedMetadata,
    FileTypeError,
    JsonParseError,
    JsonSchemaValidationError,
    PythonFileParseError,
    PythonMetadataError,
    NoFilesError,
)


def test_json_pre_analysis(tmp_path: Path) -> None:
    """It should identify the protocol as JSON and extract its metadata."""
    input_protocol_dict = make_minimal_json_protocol(
        metadata=JsonProtocolMetadata(
            author="Dr. Sy N. Tist",
            tags=["tag1", "tag2"],
            created=123.456,
        )
    ).dict(exclude_unset=True)
    # exclude_unset=True prevents Pydantic from auto-filling metadata fields that the
    # model has but that we omit here (like metadata.lastModified) with the value None.
    #
    # A caller could provide a protocol with fields omitted like this. We want to test
    # that we preserve that omission, in case there's ever a meaningful difference
    # between an omitted field and a null field.

    # Give the input protocol a metadata field that our JSON protocol schema bindings
    # don't know about. We want to test that we retain it, instead of silently
    # discarding it. An old robot server, with old schema bindings, should be able to
    # pass along metadata from new protocols even if it doesn't know about that
    # metadata.
    input_protocol_dict["metadata"]["some_unknown_extra_field"] = "hello"

    expected_metadata: ExtractedMetadata = {
        "author": "Dr. Sy N. Tist",
        "tags": ["tag1", "tag2"],
        "created": 123.456,
        # Other known fields, like lastModified, are expected to be omitted.
        "some_unknown_extra_field": "hello",
    }

    input_protocol_text = json_dumps(input_protocol_dict)
    protocol_file = tmp_path / "My JSON Protocol.json"
    protocol_file.write_text(input_protocol_text)

    result = PreAnalyzer().analyze([protocol_file])
    assert result == JsonPreAnalysis(expected_metadata)


def test_python_pre_analysis(tmp_path: Path) -> None:
    """Test Python pre-analysis.

    It should identify the protocol as Python, and extract its metadata and apiLevel.
    """
    input_protocol_text = dedent(
        """
        metadata = {
            "author": "Dr. Sy. N. Tist",
            "apiLevel": "123.456",
        }
        """
    )

    expected_metadata: ExtractedMetadata = {
        "author": "Dr. Sy. N. Tist",
        # We don't actually care if apiLevel is present here, since it's extracted into
        # its own attribute. But it's simpler to assert that apiLevel is here anyway.
        "apiLevel": "123.456",
    }
    expected_api_level = "123.456"

    protocol_file = tmp_path / "My Python Protocol.py"
    protocol_file.write_text(input_protocol_text)

    result = PreAnalyzer().analyze([protocol_file])
    assert result == PythonPreAnalysis(expected_metadata, expected_api_level)


# Apparently a bug in opentrons.protocols.parse.extract_metadata.
# It errors when a field isn't a string, even though its return type suggests
# it should allow ints.
@pytest.mark.xfail(strict=True)
def test_python_non_string_metadata(tmp_path: Path) -> None:
    """It should pass along metadata fields that aren't strings."""
    input_protocol_text = dedent(
        """
        metadata = {
            "apiLevel": "123.456",
            "anInt": 7890
        }
        """
    )

    expected_metadata: ExtractedMetadata = {
        "apiLevel": "123.456",
        "anInt": 7890,
    }
    expected_api_level = "123.456"

    protocol_file = tmp_path / "My Python Protocol.py"
    protocol_file.write_text(input_protocol_text)

    result = PreAnalyzer().analyze([protocol_file])
    assert result == PythonPreAnalysis(expected_metadata, expected_api_level)


def test_error_if_python_file_has_syntax_error(tmp_path: Path) -> None:
    """It should raise if the .py file isn't compilable."""
    protocol_text = dedent(
        """
        metadata = {
            'apiLevel': '123.456'
        }

        def run()  # Syntax error: missing colon.
            pass
        """
    )
    protocol_file = tmp_path / "My Python Protocol.py"
    protocol_file.write_text(protocol_text)

    with pytest.raises(PythonFileParseError):
        PreAnalyzer().analyze([protocol_file])


# todo(mm, 2021-09-13): Some of these tests overlap with
# opentrons.protocol_runner.parse.
# Decide where this logic should canonically live, and deduplicate.
@pytest.mark.parametrize(
    "input_text",
    [
        dedent(
            """
            # Metadata missing entirely.
            """
        ),
        dedent(
            """
            # Metadata provided, but not as a dict.
            metadata = "Hello"
            """
        ),
        dedent(
            """
            # Metadata not statically parsable.
            metadata = {"apiLevel": "123" + ".456"}
            """
        ),
        dedent(
            """
            # apiLevel missing from metadata.
            metadata = {"Hello": "World"}
            """
        ),
        dedent(
            """
            # apiLevel provided, but not as a string.
            metadata = {"apiLevel": 123.456}
            """
        ),
    ],
)
def test_error_if_bad_python_metadata(
    tmp_path: Path,
    input_text: str,
) -> None:
    """It should raise if something's wrong with the metadata block."""
    protocol_file = tmp_path / "My Python Protocol.py"
    protocol_file.write_text(input_text)
    with pytest.raises(PythonMetadataError):
        PreAnalyzer().analyze([protocol_file])


def test_error_if_json_file_is_not_valid_json(tmp_path: Path) -> None:
    """It should raise if a .json file isn't parseable as JSON."""
    protocol_file = tmp_path / "My JSON Protocol.json"
    protocol_file.write_text("This is not valid JSON.")
    with pytest.raises(JsonParseError):
        PreAnalyzer.analyze([protocol_file])


def test_error_if_json_file_does_not_conform_to_schema(tmp_path: Path) -> None:
    """It should raise if a .json file is valid JSON, but doesn't match our schema."""
    protocol_file = tmp_path / "My JSON Protocol.json"
    protocol_file.write_text('{"this_is_valid_json": true}')
    with pytest.raises(JsonSchemaValidationError):
        PreAnalyzer.analyze([protocol_file])


def test_error_if_no_files() -> None:
    """It should raise if no files are supplied."""
    with pytest.raises(NoFilesError):
        PreAnalyzer().analyze([])


def test_error_if_file_extension_unrecognized(tmp_path: Path) -> None:
    """It should raise if a file doesn't have a valid extension for a protocol."""
    non_protocol_file = tmp_path / "Foo.jpg"
    non_protocol_file.touch()
    with pytest.raises(FileTypeError):
        PreAnalyzer().analyze([non_protocol_file])


# Update or replace this placeholder test when we support multi-file protocols.
@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_multi_file_protocol(tmp_path: Path) -> None:  # noqa: D103
    file_1 = tmp_path / "protocol_file_1"
    file_1.touch()
    file_2 = tmp_path / "protocol_file_2"
    file_2.touch()
    PreAnalyzer.analyze([file_1, file_2])
