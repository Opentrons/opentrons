"""Tests for the eeprom module."""

import mock
import pytest
import tempfile

from enum import Enum
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
    """Mock out OT3GPIO and create a temp /eeprom and /name files."""
    with tempfile.TemporaryDirectory() as eeprom_dir:
        # create eeprom and name files
        eeprom_path = Path(eeprom_dir) / "eeprom"
        eeprom_name_path = eeprom_path.parent / "name"
        with open(eeprom_path, "wb"), open(eeprom_name_path, "w") as fh:
            # write we can get the name and size of the eeprom
            fh.write("24c128")
        gpio = mock.Mock(spec=OT3GPIO)
        yield EEPROMDriver(gpio, eeprom_path=eeprom_path)


def test_eeprom_setup(eeprom_api: EEPROMDriver) -> None:
    """Test that the eeprom is setup successfully."""
    # write some data to load from
    with open(eeprom_api._eeprom_path, "wb") as fh:
        fh.write(b"\x02\x11FLXA1020230602001")

    # Make sure we dont have any data loaded yet
    assert eeprom_api._name == ""
    assert eeprom_api._size == 0
    assert eeprom_api._eeprom_fd == -1
    assert len(eeprom_api._properties) == 0
    assert eeprom_api.data.serial_number is None
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None
    assert eeprom_api.data.unit_number is None

    # call the setup function
    eeprom_api.setup()

    # We now have the name and size of the eeprom
    assert eeprom_api.name == "24c128"
    assert eeprom_api.size == 16384

    # We now have a file descriptor pointing to the eeprom
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


def test_property_read_single(eeprom_api: EEPROMDriver) -> None:
    """Test that we can read one property from the eeprom."""
    # register the file descriptor
    eeprom_api.open()

    # make sure we have no data on the fake eeprom
    assert eeprom_api.properties == set()
    with open(eeprom_api._eeprom_path, "rb") as fh:
        assert fh.read() == b""

    # write multiple properties to the fake eeprom so we can test only
    # reading the one we want
    prop_ids = {PropId.FORMAT_VERSION, PropId.SERIAL_NUMBER}
    result = eeprom_api.property_write(
        {(PropId.FORMAT_VERSION, 1), (PropId.SERIAL_NUMBER, "FLXA1020230602001")}
    )

    # make sure the return value is a set of the PropIds that were written
    assert result == prop_ids

    # now we should have data in the fake eeprom
    with open(eeprom_api._eeprom_path, "rb") as fh:
        assert fh.read() != b""

    # read a single property from it and validate the data
    props = eeprom_api.property_read({PropId.FORMAT_VERSION})
    assert len(props) == 1
    for prop in props:
        assert prop.id == PropId.FORMAT_VERSION
        assert prop.value == 1
        assert eeprom_api.data.format_version == 1

    # make sure the internal state is updated
    assert len(eeprom_api.properties) == 1
    for prop in eeprom_api.properties:
        assert prop.id in prop_ids


def test_property_read_multi(eeprom_api: EEPROMDriver) -> None:
    """Test that we can read multiple properties from the eeprom."""
    # register the file descriptor
    eeprom_api.open()

    # make sure we have no data on the fake eeprom
    with open(eeprom_api._eeprom_path, "rb") as fh:
        assert fh.read() == b""

    # make sure we dont have any serialized data
    assert len(eeprom_api.properties) == 0
    assert eeprom_api.data.format_version == 1
    assert eeprom_api.data.machine_type is None
    assert eeprom_api.data.machine_version is None
    assert eeprom_api.data.programmed_date is None
    assert eeprom_api.data.unit_number is None

    # write multiple properties to the fake eeprom so we can test only
    prop_ids = {PropId.FORMAT_VERSION, PropId.SERIAL_NUMBER}
    result = eeprom_api.property_write(
        {(PropId.FORMAT_VERSION, 2), (PropId.SERIAL_NUMBER, "FLXA1020230604004")}
    )

    # make sure the return value is a set of the PropIds that were written
    assert result == prop_ids

    # now we should have data in the fake eeprom
    with open(eeprom_api._eeprom_path, "rb") as fh:
        data = fh.read()
        assert data != b""

    # read multiple properties and validate the value
    props = list(eeprom_api.property_read(prop_ids))
    assert len(props) == 2
    for prop in props:
        # check that the prop we read is the one we asked to read
        assert prop.id in prop_ids

        # validate the value we read
        if prop.id == PropId.FORMAT_VERSION:
            assert prop.value == 2
            # make sure we update our internal cache
            assert eeprom_api.data.format_version == 2

        if prop.id == PropId.SERIAL_NUMBER:
            assert prop.value == "FLXA1020230604004"
            # make sure we update our internal cache
            assert eeprom_api.data.serial_number == "FLXA1020230604004"
            assert eeprom_api.data.machine_type == "FLX"
            assert eeprom_api.data.machine_version == "A10"
            assert eeprom_api.data.programmed_date == datetime(2023, 6, 4)
            assert eeprom_api.data.unit_number == 4

    # make sure that the internal properties variable is updated as well
    for prop in eeprom_api.properties:
        assert prop.id in result


def test_property_read_overflow(eeprom_api: EEPROMDriver) -> None:
    """Test that data overflow is handled properly."""
    # while we dont have many properties right now, eventually we might
    # which means we could get into a situation where a serialized property
    # might span more than one page (64 bytes by default). In this case
    # we want to make sure data that has overflown is combined with new
    # data and re-parsed.

    # Lets bring down the default read size by patching DEFAULT_READ_SIZE,
    # this way we can run into the overflow issue with less data.
    mock.patch("opentrons_hardware.drivers.eeprom.eeprom.DEFAULT_READ_SIZE", 10)

    # write some test data greater than DEFAULT_READ_SIZE (10 in this case)
    eeprom_api.open()
    w_size = eeprom_api._write(b"\x02\x10123456789ABCDEFG")

    # verify that the length of the data we wrote is whats actually written
    r_size = len(eeprom_api._read(size=40))
    assert w_size == r_size

    # now lets do a property read with the default read size of 5, so it would take
    # at least 2 read cycles + the overflow data to reach a valid property.
    with mock.patch("opentrons_hardware.drivers.eeprom.eeprom.DEFAULT_READ_SIZE", 5):
        props = list(eeprom_api.property_read({PropId.SERIAL_NUMBER}))
        assert len(props) == 1
        assert props[0].id == PropId.SERIAL_NUMBER
        assert props[0].value == "123456789ABCDEFG"


def test_property_read_invalid_data_prop_id(eeprom_api: EEPROMDriver) -> None:
    """Test that we can handle invalid eeprom data."""
    # Invalid data refers to any data whose
    # 1. PropId (byte 0) is invalid
    # 2. Property length (byte 1) does not match the data length
    # 3. Property length (byte 1) goes over the MAX_DATA_LEN = 253b
    eeprom_api.open()

    # lets write some junk data
    w_size = eeprom_api._write(
        b"\xab\x11123456q3dasda2BCDEFG\xff"
        + b"\xff\xff\xff\xff\xff\xff\xff\xff"
        + b"\xff\xff\xff\xff\xff\xff\xff\xff"
    )

    # while we can read this data, it cant be parsed
    r_size = len(eeprom_api._read())
    assert r_size == w_size

    # if we try and parse this we get no properties
    props = eeprom_api.property_read()
    assert len(props) == 0


def test_property_read_invalid_data_blank(eeprom_api: EEPROMDriver) -> None:
    """Test reading from eeprom with default data (0xff)."""
    eeprom_api.open()

    # by default the eeprom is written with all 0xff
    # since 0xff (255) is not a valid PropId we should ignore this data
    eeprom_api._write(
        b"\xff\xff\xff\xff\xff\xff\xff\xff"
        + b"\xff\xff\xff\xff\xff\xff\xff\xff"
        + b"\xff\xff\xff\xff\xff\xff\xff\xff"
    )

    assert len(eeprom_api.property_read()) == 0


def test_property_write_single(eeprom_api: EEPROMDriver) -> None:
    """Test that we can write single properties to the eeprom."""
    eeprom_api.open()

    # make sure we have no data on the fake eeprom
    assert eeprom_api.properties == set()
    with open(eeprom_api._eeprom_path, "rb") as fh:
        assert fh.read() == b""

    # lets write on property
    prop_ids = {PropId.FORMAT_VERSION}
    result = eeprom_api.property_write({(PropId.FORMAT_VERSION, 3)})
    # make sure we wrote the property
    assert result == prop_ids

    # now lets read it back to confirm
    props = list(eeprom_api.property_read())
    assert len(props) == 1
    assert props[0].id == PropId.FORMAT_VERSION
    assert props[0].value == 3


def test_property_write_multi(eeprom_api: EEPROMDriver) -> None:
    """Test that we can write multiple properties to the eeprom."""
    eeprom_api.open()

    # make sure we have no data on the fake eeprom
    assert eeprom_api.properties == set()
    with open(eeprom_api._eeprom_path, "rb") as fh:
        assert fh.read() == b""

    # we can write multiple properties at once
    prop_ids = {PropId.FORMAT_VERSION, PropId.SERIAL_NUMBER}
    result = eeprom_api.property_write(
        {(PropId.FORMAT_VERSION, 4), (PropId.SERIAL_NUMBER, "FLXA1020230604004")}
    )

    # make sure we wrote the properties
    assert result == prop_ids

    # now read them back and make sure we have the same properties
    props = eeprom_api.property_read()
    assert len(props) == len(prop_ids)
    for prop in props:
        # make sure reading this updated our internal states
        assert prop in eeprom_api.properties
        assert prop.id in prop_ids
        if prop.id == PropId.FORMAT_VERSION:
            assert prop.value == 4
            assert eeprom_api.data.format_version == 4
        elif prop.id == PropId.SERIAL_NUMBER:
            assert prop.value == "FLXA1020230604004"
            assert eeprom_api.data.machine_type == "FLX"
            assert eeprom_api.data.machine_version == "A10"
            assert eeprom_api.data.programmed_date == datetime(2023, 6, 4)
            assert eeprom_api.data.unit_number == 4


def test_property_write_invalid_property(eeprom_api: EEPROMDriver) -> None:
    """Test that invalid properties are not written to the eeprom."""
    eeprom_api.open()

    # dont write unknown PropIds
    class FakePropId(Enum):
        FAKE = 99

    # attempt to write properties
    result = eeprom_api.property_write(
        {
            (FakePropId.FAKE, "some data"),  # type: ignore
            (PropId.SERIAL_NUMBER, "FLXA1020230604004"),
        }
    )

    # only PropId.SERIAL_NUMBER should be written
    assert len(result) == 1
    assert PropId.SERIAL_NUMBER in result

    # verify by reading the data back
    props = list(eeprom_api.property_read())
    assert len(props) == len(result) == 1
    assert props[0].id == PropId.SERIAL_NUMBER
    assert props[0].value == "FLXA1020230604004"


def test_property_write_invalid_property_data(eeprom_api: EEPROMDriver) -> None:
    """Test that invalida property data is not written to the eeprom."""
    eeprom_api.open()

    # although a PropId might be valid, we want to make sure the correct data is passed
    # in for the property type and that we arent writting invalid data.
    result = eeprom_api.property_write(
        {
            (PropId.FORMAT_VERSION, "not an int"),
            (PropId.SERIAL_NUMBER, "FLXA1020230604004"),
        }
    )

    # since PropId.FORMAT_VERSION expects an int it should not be written
    # only PropId.SERIAL_NUMBER which is a string should be on the fake eeprom
    assert len(result) == 1

    # validate by reading back the data
    props = list(eeprom_api.property_read())

    # we should have the same number of properties read as written
    assert len(props) == len(result) == 1

    assert props[0].id == PropId.SERIAL_NUMBER
    assert props[0].value == "FLXA1020230604004"
