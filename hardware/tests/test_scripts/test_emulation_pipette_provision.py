"""Tests for the emulation_pipette_provision script."""
import os
from typing import Any, Generator
import pytest
from unittest.mock import patch

from opentrons_hardware.scripts import emulation_pipette_provision


@pytest.fixture
def set_env_vars(monkeypatch: Any) -> Generator[None, None, None]:
    """Set environment variables."""
    monkeypatch.setenv(
        "LEFT_OT3_PIPETTE_DEFINITION",
        '{"pipette_name": "p1000_multi", "pipette_model": 34, "pipette_serial_code": "20230609", "eeprom_file_name": "eeprom.bin"}',
    )
    monkeypatch.setenv(
        "RIGHT_OT3_PIPETTE_DEFINITION",
        '{"pipette_name": "p50_single", "pipette_model": 34, "pipette_serial_code": "20230609", "eeprom_file_name": "eeprom.bin"}',
    )
    yield
    monkeypatch.delenv("LEFT_OT3_PIPETTE_DEFINITION")
    monkeypatch.delenv("RIGHT_OT3_PIPETTE_DEFINITION")


@pytest.fixture
def override_eeprom_dir(tmpdir: Any) -> Generator[str, None, None]:
    """Override eeprom directory."""
    volumes = tmpdir.mkdir("volumes")
    left = volumes.mkdir("left-pipette-eeprom")
    right = volumes.mkdir("right-pipette-eeprom")

    with patch.multiple(
        emulation_pipette_provision,
        LEFT_PIPETTE_EEPROM_DIR_PATH=str(left),
        RIGHT_PIPETTE_EEPROM_DIR_PATH=str(right),
    ):
        yield tmpdir


@pytest.fixture
def left_eeprom_path(override_eeprom_dir: Generator[str, None, None]) -> str:
    """Left eeprom path."""
    return os.path.join(
        emulation_pipette_provision.LEFT_PIPETTE_EEPROM_DIR_PATH, "eeprom.bin"
    )


@pytest.fixture
def right_eeprom_path(override_eeprom_dir: Generator[str, None, None]) -> str:
    """Right eeprom path."""
    return os.path.join(
        emulation_pipette_provision.RIGHT_PIPETTE_EEPROM_DIR_PATH, "eeprom.bin"
    )


def test_main(
    set_env_vars: Generator[None, None, None],
    left_eeprom_path: str,
    right_eeprom_path: str,
) -> None:
    """Test main."""
    assert not os.path.exists(left_eeprom_path)
    assert not os.path.exists(right_eeprom_path)
    emulation_pipette_provision.main()
    assert os.path.exists(left_eeprom_path)
    assert os.path.exists(right_eeprom_path)
