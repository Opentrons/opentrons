"""Integration tests for the JsonFileReader interface."""
import pytest
import json
from pathlib import Path

from opentrons.protocols.models import JsonProtocol
from opentrons.protocol_runner.protocol_file import ProtocolFile, ProtocolFileType
from opentrons.protocol_runner.json_file_reader import JsonFileReader


@pytest.fixture
def json_protocol_file(
    tmpdir: Path,
    json_protocol_dict: dict,
) -> ProtocolFile:
    """Get a ProtocolFile with JSON on-disk."""
    file_path = tmpdir / "protocol.json"
    file_path.write_text(json.dumps(json_protocol_dict), encoding="utf-8")

    return ProtocolFile(file_type=ProtocolFileType.JSON, file_path=file_path)


@pytest.fixture
def subject() -> JsonFileReader:
    """Get a JsonFileReader test subject."""
    return JsonFileReader()


def test_reads_file(
    json_protocol_dict: dict,
    json_protocol_file: ProtocolFile,
    subject: JsonFileReader,
) -> None:
    """It should read a JSON file into a JsonProtocol model."""
    result = subject.read(json_protocol_file)

    # TODO(mc, 2021-06-03): this `parse_obj` is sort of mirroring
    # the implementation exactly; rethink and revisit
    assert result == JsonProtocol.parse_obj(json_protocol_dict)
