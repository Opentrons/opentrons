# noqa: D100

from pathlib import Path
from textwrap import dedent

from opentrons.protocols.models.json_protocol import (
    Metadata as JsonProtocolMetadata,
    make_minimal as make_minimal_json_protocol,
)

from opentrons.protocol_runner.pre_analysis import (
    PreAnalyzer,
    JsonPreAnalysis,
    PythonPreAnalysis,
    Metadata as ExtractedMetadata,
)


def test_json_pre_analysis(tmp_path: Path) -> None:
    """It should identify the protocol as JSON and extract its metadata."""
    input_protocol_text = make_minimal_json_protocol(
        metadata=JsonProtocolMetadata(
            author="Dr. Sy N. Tist",
            tags=["tag1", "tag2"],
            created=123.456,
        )
    ).json()

    expected_metadata: ExtractedMetadata = {
        "author": "Dr. Sy N. Tist",
        "tags": ["tag1", "tag2"],
        "created": 123.456,
    }

    protocol_file = tmp_path / "My JSON Protocol.json"
    protocol_file.write_text(input_protocol_text)

    result = PreAnalyzer().analyze([protocol_file])
    assert result == JsonPreAnalysis(expected_metadata)


# Ideally, we'd use a shared expected metadata dict for both JSON and Python, but each
# protocol type currently imposes its own restrictions on what can appear in the
# metadata, so these tests need to be separate.
def test_python_pre_analysis(tmp_path: Path) -> None:
    """Test Python pre-analysis.

    It should identify the protocol as Python, and extract its metadata and apiLevel.
    """
    input_protocol_text = dedent(
        """
        metadata = {
            "author": "Dr. Sy. N. Tist",
            "aFloat": 987.654,
            "apiLevel": "123.456",
        }
        """
    )

    expected_metadata: ExtractedMetadata = {
        "author": "Dr. Sy. N. Tist",
        "aFloat": 987.654,
        # We don't actually care if apiLevel is present here, since it's extracted into
        # its own attribute. But it's simpler to assert that apiLevel is here anyway.
        "apiLevel": "123.456",
    }
    expected_api_level = "123.456"

    protocol_file = tmp_path / "My Python Protocol.py"
    protocol_file.write_text(input_protocol_text)

    result = PreAnalyzer().analyze([protocol_file])
    assert result == PythonPreAnalysis(expected_metadata, expected_api_level)


def test_error_if_python_has_no_metadata() -> None:
    # Metadata missing and apiLevel missing from metadata
    raise NotImplementedError()


def test_error_if_python_metadata_has_no_apilevel() -> None:
    raise NotImplementedError()


def test_error_if_json_unparseable_as_json() -> None:
    raise NotImplementedError()


def test_error_if_json_not_valid_as_protocol() -> None:
    raise NotImplementedError()


def test_error_if_no_files() -> None:
    raise NotImplementedError()


def test_error_if_too_many_files() -> None:
    raise NotImplementedError()
