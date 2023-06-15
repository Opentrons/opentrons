"""Tests for the emulation_pipette_provision script."""
import json
import os
from typing import Any, Generator, Tuple
import pytest
from opentrons_hardware.firmware_bindings.constants import PipetteName
from opentrons_hardware.scripts import emulation_pipette_provision
from opentrons_hardware.instruments.pipettes.serials import serial_val_from_parts


@pytest.fixture
def tmp_eeprom_file_paths(tmpdir: Any) -> Tuple[str, str]:
    """Create temporary eeprom file paths."""
    volumes = tmpdir.mkdir("volumes")
    left_dir = volumes.mkdir("left-pipette-eeprom")
    right_dir = volumes.mkdir("right-pipette-eeprom")
    left_file_path = left_dir.join("eeprom.bin")
    right_file_path = right_dir.join("eeprom.bin")
    return (str(left_file_path), str(right_file_path))


@pytest.fixture
def set_env_vars(
    tmp_eeprom_file_paths: Generator[Tuple[str, str], None, None], monkeypatch: Any
) -> Generator[None, None, None]:
    """Set environment variables."""
    left, right = tmp_eeprom_file_paths
    monkeypatch.setenv(
        "LEFT_OT3_PIPETTE_DEFINITION",
        json.dumps(
            {
                "pipette_name": "p1000_multi",
                "pipette_model": 34,
                "pipette_serial_code": "20230609",
                "eeprom_file_path": left,
            }
        ),
    )

    monkeypatch.setenv(
        "RIGHT_OT3_PIPETTE_DEFINITION",
        json.dumps(
            {
                "pipette_name": "p50_multi",
                "pipette_model": 34,
                "pipette_serial_code": "20230609",
                "eeprom_file_path": right,
            }
        ),
    )
    yield
    monkeypatch.delenv("LEFT_OT3_PIPETTE_DEFINITION")
    monkeypatch.delenv("RIGHT_OT3_PIPETTE_DEFINITION")


@pytest.fixture
def expected_values() -> Tuple[bytes, bytes]:
    """Expected values."""
    return (
        serial_val_from_parts(
            PipetteName["p1000_multi"], 34, "20230609".encode("utf-8")
        ),
        serial_val_from_parts(PipetteName["p50_multi"], 34, "20230609".encode("utf-8")),
    )


def test_main(
    set_env_vars: Generator[None, None, None],
    tmp_eeprom_file_paths: Tuple[str, str],
    expected_values: Tuple[bytes, bytes],
) -> None:
    """Test main."""
    left_eeprom_path, right_eeprom_path = tmp_eeprom_file_paths
    expected_left, expected_right = expected_values
    assert not os.path.exists(left_eeprom_path)
    assert not os.path.exists(right_eeprom_path)
    emulation_pipette_provision.main()
    assert os.path.exists(left_eeprom_path)
    assert os.path.exists(right_eeprom_path)

    with open(left_eeprom_path, "rb") as f:
        left_eeprom = f.read()
    with open(right_eeprom_path, "rb") as f:
        right_eeprom = f.read()

    assert left_eeprom == expected_left
    assert right_eeprom == expected_right
