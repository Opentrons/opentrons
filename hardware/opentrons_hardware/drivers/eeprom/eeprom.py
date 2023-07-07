"""Module to read/write to the eeprom on the Flex SOM."""

import re
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Set, Type, Tuple, Any
from types import TracebackType

from ..gpio import OT3GPIO
from .types import (
    PropId,
    Property,
    EEPROMData,
)
from .utils import (
    parse_data,
    generate_packet,
)

logger = logging.getLogger(__name__)

# The default bus line and address of the i2c eeprom device
DEFAULT_BUS = 3
DEFAULT_ADDRESS = "0050"
DEFAULT_READ_SIZE = 64


class EEPROMDriver:
    """This class lets you read/write to the eeprom using a sysfs file."""

    def __init__(
        self,
        gpio: OT3GPIO,
        bus: Optional[int] = DEFAULT_BUS,
        address: Optional[str] = DEFAULT_ADDRESS,
        eeprom_path: Optional[Path] = None,
    ) -> None:
        """Contructor

        Args:
            gpio: An instance of the gpio class so we can toggle lines on the SOM
            bus: The i2c bus this device is on
            address: The unique address for this device
            eeprom_path: The path of the eeprom device, for testing.
        """
        self._gpio = gpio
        self._bus = bus
        self._address = address
        self._eeprom_path = eeprom_path or Path(
            f"/sys/bus/i2c/devices/{bus}-{address}/eeprom"
        )
        self._size = 0
        self._name = ""
        self._eeprom_fd = -1
        self._eeprom_data: EEPROMData = EEPROMData()
        self._properties: Set[Property] = set()

    @property
    def name(self) -> str:
        """The name of this eeprom device."""
        return self._name

    @property
    def address(self) -> str:
        """The address of the i2c device."""
        return f"{self._bus}-{self._address}"

    @property
    def size(self) -> int:
        """The size in bytes of the eeprom."""
        return self._size

    @property
    def data(self) -> EEPROMData:
        """Object representing the serialized data stored in the eeprom."""
        return self._eeprom_data

    @property
    def properties(self) -> Set[Property]:
        """Returns a set of Property objects that are on the eeprom."""
        return self._properties

    def __enter__(self) -> "EEPROMDriver":
        """Enter runtime context."""
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]] = None,
        exc_value: Optional[BaseException] = None,
        traceback: Optional[TracebackType] = None,
    ) -> bool:
        """Exit runtime context and close the file descriptor."""
        self._gpio.deactivate_eeprom_wp()
        return self.close()

    def __del__(self) -> None:
        """Destructor to close the file descriptor."""
        self.close()

    def setup(self) -> None:
        """Setup the class and serialize the eeprom data."""
        # Open a file descriptor for the eeprom
        self._eeprom_fd = self.open()
        # Get the eeeprom metadata
        self._name, self._size = self._get_eeprom_info()
        # Read and serialize eeprom data
        self.property_read()

    def open(self) -> int:
        """Opens up the eeprom file and returns the file descriptor."""
        if self._eeprom_fd > 0:
            logger.warning("File descriptor already opened for eeprom")
            return self._eeprom_fd

        try:
            self._eeprom_fd = os.open(self._eeprom_path, os.O_RDWR)
        except OSError:
            logger.error(f"Could not open eeprom file - {self._eeprom_path}")
            self._eeprom_fd = -1
        return self._eeprom_fd

    def close(self) -> bool:
        """Close the file descriptor"""
        if self._eeprom_fd != -1:
            logger.debug("Closing eeprom file descriptor")
            os.close(self._eeprom_fd)
            self._eeprom_fd = -1
        return True

    def property_read(self, prop_ids: Optional[Set[PropId]] = None) -> Set[Property]:
        """Returns a set of properties read from the eeprom."""
        properties: Set[Property] = set()
        address = 0
        old_overflow = overflow = b""
        while True:
            page = address // DEFAULT_READ_SIZE + 1
            logger.debug(f"Reading eeprom page {page}")
            # read data in n byte chunks and prepend any leftover data from previous read
            data = overflow + self._read(size=DEFAULT_READ_SIZE, address=address)
            props, overflow = parse_data(data, prop_ids=prop_ids)
            if props:
                properties.update(props)
            elif not props and not overflow:
                # we dont have any more valid data to read so break out.
                break
            elif old_overflow == overflow:
                # we have stale data
                break

            # read the next page
            old_overflow = overflow
            address += DEFAULT_READ_SIZE

        # sort by PropId value to keep things in order
        properties = set(sorted(properties, key=lambda prop: prop.id.value))

        # update internal states
        if properties:
            self._properties = properties
            self._populate_data()
        return properties

    def property_write(self, properties: Set[Tuple[PropId, Any]]) -> Set[PropId]:
        """Write the given properties to the eeprom, returning a set of the successful ones."""
        written_props: Set[PropId] = set()
        # sort the properties so they are written in ascending order
        properties = set(sorted(properties, key=lambda prop: prop[0].value))
        data: bytes = b""
        for prop_id, value in properties:
            packet = generate_packet(prop_id, value)
            if packet:
                written_props.add(prop_id)
                data += packet
        if data:
            try:
                self._gpio.activate_eeprom_wp()
                self._write(data)
            except RuntimeError:
                # something went wrong, clear written props
                written_props = set()
            finally:
                self._gpio.deactivate_eeprom_wp()
        return written_props

    def _read(self, size: int = DEFAULT_READ_SIZE, address: int = 0) -> bytes:
        """Reads a number of bytes from the eeprom."""
        if self._eeprom_fd == -1:
            raise RuntimeError(f"eeprom file descriptor is not opened {self.name}.")

        logger.debug(
            f"Reading {size} bytes from address {hex(address)} for device {self.name}"
        )
        data = b""
        try:
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            data = os.read(self._eeprom_fd, size)
        except Exception as e:
            logger.error(f"Could not read from eeprom {self.name} - {e}")
        return data

    def _write(self, data: bytes, address: int = 0) -> int:
        """Write data to the eeprom at the given address."""
        if self._eeprom_fd == -1:
            raise RuntimeError(
                "Could not read from eeprom, file descriptor is unavailable"
            )

        try:
            logger.debug(
                f"Writing {len(data)} bytes to address {hex(address)} for device {self.name} - {data.hex()}"
            )
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            return os.write(self._eeprom_fd, data)
        except TimeoutError:
            logging.error(
                f"Could not write data to eeprom {self.address}, make sure the write bit is low."
            )
            raise

    def _get_eeprom_info(self) -> Tuple[str, int]:
        """This will get the name and size in bytes of the eeprom."""
        name = ""
        size = 0
        eeprom_name = self._eeprom_path.parent / "name"
        if os.path.exists(eeprom_name):
            with open(eeprom_name) as fh:
                name = fh.read().strip()
            match = re.match(r"24c([\d]+)", name)
            if match:
                # The eeprom size is in kbytes so we need to
                # multiply by 128 to get the bytes
                size = int(match[1]) * 128
        return name, size

    def _populate_data(self) -> EEPROMData:
        """This will create and populate the EEPROMData object."""
        for prop in self._properties:
            if prop.id == PropId.FORMAT_VERSION:
                self._eeprom_data.format_version = prop.value
            elif prop.id == PropId.SERIAL_NUMBER and len(prop.value) >= 17:
                self._eeprom_data.serial_number = prop.value
                self._eeprom_data.machine_type = prop.value[:3]
                self._eeprom_data.machine_version = prop.value[3:6]
                date_string = prop.value[6:14]
                self._eeprom_data.programmed_date = datetime.strptime(
                    date_string, "%Y%m%d"
                )
                self._eeprom_data.unit_number = int(prop.value[14:17])
        return self._eeprom_data
