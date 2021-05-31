"""Tests for the create_protocol_runner factory."""
from mock import MagicMock
from pathlib import Path

from opentrons.file_runner import ProtocolFileType, JsonFileRunner, create_file_runner


def test_create_json_runner() -> None:
    """It should be able to create a JSON file runner."""
    file_type = ProtocolFileType.JSON
    file_path = Path("/dev/null")

    result = create_file_runner(
        file_type=file_type,
        file_path=file_path,
        engine=MagicMock(),
    )

    assert isinstance(result, JsonFileRunner)
