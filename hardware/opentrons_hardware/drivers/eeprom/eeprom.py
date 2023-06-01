"""Module to read/write to the eeprom on the Flex SOM."""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Set, Type, List, Tuple, Any
from types import TracebackType

from .types import (
    PropId,
    Property,
    MachineType,
    EEPROMData,
)
from .utils import (
    parse_data,
    serialize_properties,
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
"""


class EEPROM:
    """This class lets you read/write to the eeprom using a sysfs file."""

    def __init__(
        self,
        bus: Optional[int] = DEFAULT_BUS,
        address: Optional[str] = DEFAULT_ADDRESS,
    ) -> None:
        """Contructor

        Args:
            bus: The i2c bus this device is on
            address: The unique address for this device
        """
        self._bus = bus
        self._address = address
        self._eeprom_filepath = Path(f"/sys/bus/i2c/devices/{bus}-{address}/eeprom")
        self._eeprom_fd = -1
        self._eeprom_data: Optional[EEPROMData] = None
        self._properties: Set[Property] = set()
        self.open()

    @property
    def name(self) -> str:
        """The name of the i2c device."""
        return f"{self._bus}-{self._address}"

    @property
    def data(self) -> Optional[EEPROMData]:
        """Object representing the serialized data stored in the eeprom."""
        return self._eeprom_data

    def properties(self) -> Set[Property]:
        """Set of properties that are on the eeprom."""
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
        return self.close()

    def __del__(self) -> None:
        """Destructor to close the file descriptor."""
        self.close()

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

    def _write(self, data: bytes, address: int) -> int:
        """Write data to the eeprom at the given address."""
        if self._eeprom_fd == -1:
            raise RuntimeError(
                "Could not read from eeprom, file descriptor is unavailable"
            )

        try:
            # TODO: (ba, 2023-05-25): Need to format data here (START + Length + Type + Data)
            formatted_data = data
            logger.debug(
                f"Writting {len(data)} bytes to address {hex(address)} for device {self.name} - {data.hex()}"
            )
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            # TODO: (ba, 2023-05-25): Set the write bit (SODIMM_222) LOW before writting
            return os.write(self._eeprom_fd, formatted_data)
        except TimeoutError:
            logging.error(
                f"Could not write data to eeprom {self.name}, make sure the write bit is low."
            )
            return -1

    def property_read(self, prop_ids: Optional[Set[PropId]] = None) -> Set[Property]:
        """Returns a set of properties read from the eeprom."""
        # read intil we dont have any more data
        properties: Set[Property] = set()
        # keep track of data that might be an incomplete packet
        data_overflow = b""
        while True:
            # read data in 64 byte chunks
            data = self._read(size=DEFAULT_READ_SIZE)
            print(f"read data from eeprom - {data.hex()}")
            # TODO (ba, 2023-06-01): We need to validate the packet
            # 1. This means we need to keep reading data until we either have a page of 0xff
            # 2. We also have to take care of packets crossing over more than one page
            # THIS IS CRITICAL!
            props = parse_data(data, prop_ids=prop_ids)
            if not props:
                # we dont have any more properties to read.
                break
            # TODO (ba, 2023-06-01): compare the requested prop_ids to the parsed ones and break if equal.
            properties.update(props)
            break
        return properties

    def property_write(self, properties: Tuple[PropId, Any]) -> List[PropId]:
        """Write the given properties to the eeprom, returning a list of the successful ones."""
        for prop_id, data in properties:
            # prepare packet
            pass
        return list()

    def serialize(self) -> EEPROMData:
        """Returns the serialized data in the eeprom."""
        return EEPROMData(
            som_manufacturer_id="test",
            opentrons_serial_id="opentrons_test",
            programmed_date=datetime.now(),
            device_type=MachineType.FLEX,
        )
