"""Integration tests for the JsonFileReader interface."""
import pytest
import json
from pathlib import Path

from opentrons.protocols.models import JsonProtocol
from opentrons.file_runner import JsonProtocolFile
from opentrons.file_runner.json_file_reader import JsonFileReader


@pytest.fixture
def json_protocol_file(
    tmpdir: Path,
    json_protocol_dict: dict,
) -> JsonProtocolFile:
    """Get a JsonProtocolFile with JSON on-disk."""
    file_path = tmpdir / "protocol.json"
    file_path.write_text(json.dumps(json_protocol_dict), encoding="utf-8")

    return JsonProtocolFile(file_path=file_path)


@pytest.fixture
def subject() -> JsonFileReader:
    """Get a JsonFileReader test subject."""
    return JsonFileReader()


def test_reads_file(
    json_protocol_dict: dict,
    json_protocol_file: JsonProtocolFile,
    subject: JsonFileReader,
) -> None:
    """It should read a JSON file into a JsonProtocol model."""
    result = subject.read(json_protocol_file)

    assert result == JsonProtocol.parse_obj(json_protocol_dict)
