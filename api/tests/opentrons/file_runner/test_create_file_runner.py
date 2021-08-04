"""Tests for the create_protocol_runner factory."""
import pytest
from pathlib import Path

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine, create_protocol_engine
from opentrons.file_runner import (
    ProtocolFileType,
    ProtocolFile,
    JsonFileRunner,
    PythonFileRunner,
    create_file_runner,
)


@pytest.fixture
async def protocol_engine(hardware: HardwareAPI) -> ProtocolEngine:
    """Get an actual ProtocolEngine for smoke-test purposes."""
    return await create_protocol_engine(hardware_api=hardware)


async def test_create_json_runner(
    protocol_engine: ProtocolEngine,
    json_protocol_file: Path,
) -> None:
    """It should be able to create a JSON file runner."""
    protocol_file = ProtocolFile(
        file_type=ProtocolFileType.JSON,
        file_path=json_protocol_file,
    )

    result = create_file_runner(
        protocol_file=protocol_file,
        engine=protocol_engine,
    )

    assert isinstance(result, JsonFileRunner)


async def test_create_python_runner(
    protocol_engine: ProtocolEngine,
    python_protocol_file: Path,
) -> None:
    """It should be able to create a Python file runner."""
    protocol_file = ProtocolFile(
        file_type=ProtocolFileType.PYTHON,
        file_path=python_protocol_file,
    )

    result = create_file_runner(
        protocol_file=protocol_file,
        engine=protocol_engine,
    )

    assert isinstance(result, PythonFileRunner)
