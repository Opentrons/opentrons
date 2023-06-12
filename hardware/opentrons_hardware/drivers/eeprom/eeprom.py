"""Module to read/write to the eeprom on the Flex SOM."""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Set, Type, List, Tuple, Any
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


"""

NOTES:

1. serialized property data can have a maximum size of 254 bytes
   start (1b) + len (1b) + prop_id (1b) + data (255b) + end (1b)
   The maximum property packet can be 258bytes long (data (255b) + header (3b))
   ex.
      fe0201010d
      feff04..254...0d

2. Need to deal with property_read incomplete packet case
3. Need to deal with property_write only able to write 1 page of data
4. Do we want to clear the eeprom when we write???
5. In property_write, return the PropIds of the properties that were written successfully.
"""


class EEPROM:
    """This class lets you read/write to the eeprom using a sysfs file."""

    def __init__(
        self,
        bus: Optional[int] = DEFAULT_BUS,
        address: Optional[str] = DEFAULT_ADDRESS,
        gpio: Optional[OT3GPIO] = None,
    ) -> None:
        """Contructor

        Args:
            gpio: The gpio device so we can set the eeprom wp
            bus: The i2c bus this device is on
            address: The unique address for this device
        """
        self._bus = bus
        self._address = address
        self._gpio = gpio
        self._eeprom_filepath = Path(f"/sys/bus/i2c/devices/{bus}-{address}/eeprom")
        self._eeprom_fd = -1
        self._eeprom_data: EEPROMData = EEPROMData()
        self._properties: Set[Property] = set()

    @property
    def name(self) -> str:
        """The name of the i2c device."""
        return f"{self._bus}-{self._address}"

    @property
    def data(self) -> EEPROMData:
        """Object representing the serialized data stored in the eeprom."""
        return self._eeprom_data

    @property
    def properties(self) -> Set[Property]:
        """Returns a set of Property objects that are on the eeprom."""
        return self._properties

    def __enter__(self) -> "EEPROM":
        """Enter runtime context."""
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_value: Optional[BaseException],
        traceback: Optional[TracebackType],
    ) -> bool:
        """Exit runtime context and close the file descriptor."""
        self._gpio.deactivate_eeprom_wp()
        return self.close()

    def __del__(self) -> None:
        """Destructor to close the file descriptor."""
        self.close()

    def setup(self) -> None:
        """Setup the class and instantiate from memory."""
        self._eeprom_fd = self.open()
        self._properties = self.property_read()
        self._eeprom_data = self._populate_data()

    def open(self) -> int:
        """Opens up the eeprom file and returns the file descriptor."""
        if self._eeprom_fd > 0:
            logger.warning("File descriptor already opened for eeprom")
            return self._eeprom_fd
        try:
            self._eeprom_fd = os.open(self._eeprom_filepath, os.O_RDWR)
        except OSError:
            logger.error(f"Could not open eeprom file - {self._eeprom_filepath}")
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
        while True:
            # read data in n byte chunks
            data = self._read(size=DEFAULT_READ_SIZE, address=address)
            props = parse_data(data, prop_ids=prop_ids)
            if not props:
                # we dont have any more valid data to read so break out.
                break
            properties.update(props)
            # read the next page
            address += DEFAULT_READ_SIZE

        # sort by PropId value to keep things in order
        return set(sorted(properties, key=lambda prop: prop.id.value))

    def property_write(
        self, properties: Set[Tuple[PropId, Any]], force: bool = False
    ) -> List[PropId]:
        """Write the given properties to the eeprom, returning a list of the successful ones."""
        # sort the properties so they are written in ascending order
        properties = set(sorted(properties, key=lambda prop: prop[0].value))
        data: bytes = b""
        for prop_id, value in properties:
            packet = generate_packet(prop_id, value)
            if packet:
                data += packet
        if data:
            try:
                if self._gpio:
                    self._gpio.activate_eeprom_wp()
                size = self._write(data)
            finally:
                if self._gpio:
                    self._gpio.deactivate_eeprom_wp()
        return list()

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
                f"Writting {len(data)} bytes to address {hex(address)} for device {self.name} - {data.hex()}"
            )
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            return os.write(self._eeprom_fd, data)
        except TimeoutError:
            logging.error(
                f"Could not write data to eeprom {self.name}, make sure the write bit is low."
            )
            return -1

    def _populate_data(self) -> EEPROMData:
        """This will create and populate the EEPROMData object."""
        for prop in self._properties:
            if prop.id == PropId.FORMAT_VERSION:
                self._eeprom_data.format_version = prop.value
            elif prop.id == PropId.SERIAL_NUMBER and len(prop.value) >= 22:
                self._eeprom_data.serial_number = prop.value
                self._eeprom_data.machine_type = prop.value[:3]
                self._eeprom_data.machine_version = prop.value[3:6]
                date_string = prop.value[6:14]
                self._eeprom_data.programmed_date = datetime.strptime(
                    date_string, "%Y%m%d"
                )
                self._eeprom_data.manufacturing_facility = prop.value[14:15]
                self._eeprom_data.unit_number = int(prop.value[15:18])
                self._eeprom_data.unique_id = prop.value[18:22]
        return self._eeprom_data
