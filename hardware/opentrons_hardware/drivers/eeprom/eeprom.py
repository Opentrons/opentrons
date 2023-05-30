"""Module to read/write to the eeprom on the Flex SOM."""

import os
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Type, List, Tuple, Any
from types import TracebackType

from .types import (
    PropId,
    PropType,
    Property,
    MachineType,
    EEPROMSize,
    EEPROMData,
)

logger = logging.getLogger(__name__)

# TODO (ba, 2023-05-25): The eeprom device needs to be dynamic
I2C_BUS_LINE = "/sys/bus/i2c"
EEPROM_FILEPATH = os.path.join(I2C_BUS_LINE, "devices/3-0050/eeprom")


class EEPROM:
    """This class lets you read/write to the eeprom using a sysfs file."""

    def __init__(
        self,
        eeprom_filepath: Optional[str] = None,
        eeprom_size: Optional[EEPROMSize] = EEPROMSize.FLEXA1,
    ) -> None:
        """Contructor

        Args:
            eeprom_filepath: The location of the eeprom sysfs symlink
        """
        self._eeprom_size = eeprom_size or EEPROMSize.FLEXA1
        self._eeprom_filepath = Path(eeprom_filepath or EEPROM_FILEPATH)
        self._eeprom_fd = -1
        self._eeprom_data: Optional[EEPROMData] = None
        self._properties: List[Property] = list()
        self.open()

    @property
    def data(self) -> Optional[EEPROMData]:
        """Object representing the serialized data stored in the eeprom."""
        return self._eeprom_data

    def properties(self) -> List[Property]:
        """List of properties that are on the eeprom."""
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

    def _read(self, size: int = 16, address: int = 0) -> bytes:
        """Reads a number of bytes from the eeprom."""
        if self._eeprom_fd == -1:
            raise RuntimeError(f"eeprom file descriptor is not opened.")

        logger.debug(f"Im reading from eeprom - {self._eeprom_filepath}")
        data = b""
        try:
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            data = os.read(self._eeprom_fd, size)
        except Exception as e:
            logger.error(f"Could not read from eeprom - {e}")
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
            logger.debug(f"EEPROM WRITE: {formatted_data.hex()} to {hex(address)}")
            os.lseek(self._eeprom_fd, address, os.SEEK_SET)
            # TODO: (ba, 2023-05-25): Set the write bit (SODIMM_222) LOW before writting
            return os.write(self._eeprom_fd, formatted_data)
        except TimeoutError:
            logging.error(
                f"Could not write data to eeprom, make sure the write bit is low."
            )
            return -1

    def property_read(self, prop_ids: Optional[List[PropId]]) -> List[Property]:
        """Returns a list of properties read from the eeprom."""
        prop_ids = prop_ids or PropId.__members__
        
        return list()

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
