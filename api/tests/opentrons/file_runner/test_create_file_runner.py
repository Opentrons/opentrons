"""Tests for the create_protocol_runner factory."""
from mock import MagicMock
from pathlib import Path

from opentrons.file_runner import (
    ProtocolFileType,
    ProtocolFile,
    JsonFileRunner,
    create_file_runner,
)


def test_create_json_runner() -> None:
    """It should be able to create a JSON file runner."""
    protocol_file = ProtocolFile(
        file_type=ProtocolFileType.JSON,
        file_path=Path("/dev/null"),
    )

    result = create_file_runner(
        protocol_file=protocol_file,
        engine=MagicMock(),
    )

    assert isinstance(result, JsonFileRunner)
