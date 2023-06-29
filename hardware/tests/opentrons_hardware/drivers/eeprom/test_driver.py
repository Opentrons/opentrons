"""Tests for the eeprom module."""

import mock
import pytest
import tempfile

from pathlib import Path
from datetime import datetime
from typing import Generator


from opentrons_hardware.drivers import OT3GPIO
from opentrons_hardware.drivers.eeprom import (
    EEPROMDriver,
    PropId,
)


@pytest.fixture
def eeprom_api() -> Generator[EEPROMDriver, None, None]:
    """Mock out OT3GPIO"""
    with tempfile.NamedTemporaryFile() as eeprom_path:
        gpio = mock.Mock(spec=OT3GPIO)
        print("EEPROM_PATH: ", eeprom_path.name)
        yield EEPROMDriver(gpio, eeprom_path=Path(eeprom_path.name))


def test_eeprom_setup(eeprom_api: EEPROMDriver) -> None:
    """Test that the eeprom is setup successfully."""
    # write some data to load from
    with open(eeprom_api._eeprom_path, "wb") as fh:
        fh.write(b"\x02\x11FLXA1020230602001")

    # Make sure we dont have any data loaded yet
    assert eeprom_api._eeprom_fd == -1
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None
    assert eeprom_api.data.unit_number is None

    # call the setup function
    eeprom_api.setup()

    # We know have a file descriptor pointing to the eeprom
    assert eeprom_api._eeprom_fd != -1
    # As well as some properties the setup function deserialized
    assert len(eeprom_api._properties) == 1
    assert {prop.id == PropId.SERIAL_NUMBER for prop in eeprom_api._properties}
    assert eeprom_api.data.serial_number == "FLXA1020230602001"
    assert eeprom_api.data.machine_type == "FLX"
    assert eeprom_api.data.machine_version == "A10"
    assert eeprom_api.data.programmed_date == datetime(2023, 6, 2)
    assert eeprom_api.data.unit_number == 1


def test_eeprom_setup_no_data(eeprom_api: EEPROMDriver) -> None:
    """Test that we have default values if there is no data to load during setup."""
    # Make sure we dont have any data loaded yet
    assert eeprom_api._eeprom_fd == -1
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None
    assert eeprom_api.data.unit_number is None

    # call the setup function
    eeprom_api.setup()

    # We know have a file descriptor pointing to the eeprom
    assert eeprom_api._eeprom_fd != -1

    # But we dont have any new data loaded in
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None
    assert eeprom_api.data.unit_number is None


def test_eeprom_open(eeprom_api: EEPROMDriver) -> None:
    """Test that eeprom fd is opened before anything else."""
    # write some data to load from
    with open(eeprom_api._eeprom_path, "wb") as fh:
        fh.write(b"\x02\x11FLXA1020230602001")

    # Make sure we dont have any data loaded yet
    assert eeprom_api._eeprom_fd == -1
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None

    # call read function, which will raise a RuntimeError exception
    with pytest.raises(RuntimeError):
        eeprom_api.property_read({PropId.SERIAL_NUMBER})

    # now if we open the eeprom fd for reading we should succeed
    eeprom_api.open()
    assert eeprom_api._eeprom_fd != 1

    # now that we have a file descriptor, read some data from it
    result = eeprom_api.property_read({PropId.SERIAL_NUMBER})
    assert len(result) == 1
    assert {prop.id == PropId.SERIAL_NUMBER for prop in result}


def test_eeprom_open_context(eeprom_api: EEPROMDriver) -> None:
    """Test that we can use the EEPROMDriver class as a context manager."""
    with open(eeprom_api._eeprom_path, "wb") as fh:
        fh.write(b"\x02\x11FLXA1020230602001")

    # Make sure we dont have any data loaded yet
    assert eeprom_api._eeprom_fd == -1
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None

    # make sure we can read within context
    with eeprom_api as eeprom:
        assert eeprom._eeprom_fd != -1
        result = eeprom.property_read()
        assert len(result) == 1

    # now we have left context the eeprom fd should be closed
    assert eeprom_api._eeprom_fd == -1


def test_eeprom_open_more_than_once(eeprom_api: EEPROMDriver) -> None:
    """Test that we can only have one fd open at once."""
    # the file descriptor is closed by default
    assert eeprom_api._eeprom_fd == -1
    # once we call open we get a non -1 fd
    old_fd = eeprom_api.open()
    assert eeprom_api._eeprom_fd != -1

    # however if we can open again we dont create a new fd, but return the old one
    new_fd = eeprom_api.open()
    assert new_fd == old_fd


def test_eeprom_close(eeprom_api: EEPROMDriver) -> None:
    """Test closing of the file descriptor."""
    # nothing happens if the fd is already closed
    assert eeprom_api._eeprom_fd == -1
    assert eeprom_api.close()

    # if the fd is open then we close it, we clear the fd variable
    old_fd = eeprom_api.open()
    assert old_fd != -1

    assert eeprom_api.close()
    assert eeprom_api._eeprom_fd != old_fd
    assert eeprom_api._eeprom_fd == -1


def test_eeprom_read(eeprom_api: EEPROMDriver) -> None:
    """Test that we can read data from file descriptor."""
    pass
