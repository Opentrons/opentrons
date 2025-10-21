from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from opentrons.drivers.types import (
    ABSMeasurementMode,
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderDeviceState,
    AbsorbanceReaderPlatePresence,
)


class AbstractAbsorbanceReaderDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to absorbance reader"""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from absorbance reader"""
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        """Check connection to absorbance reader"""
        ...

    @abstractmethod
    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        ...

    @abstractmethod
    async def get_available_wavelengths(self) -> List[int]:
        ...

    @abstractmethod
    async def initialize_measurement(
        self,
        wavelengths: List[int],
        mode: ABSMeasurementMode = ABSMeasurementMode.SINGLE,
        reference_wavelength: Optional[int] = None,
    ) -> None:
        """Initialize measurement for the device in single or multi mode for the given wavelengths"""
        ...

    @abstractmethod
    async def get_measurement(self) -> List[List[float]]:
        """Gets one or more measurements based on the current configuration."""
        ...

    @abstractmethod
    async def get_status(self) -> AbsorbanceReaderDeviceState:
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """Get device info"""
        ...

    @abstractmethod
    async def get_uptime(self) -> int:
        """Get device uptime"""
        ...

    @abstractmethod
    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        """Check if there is a plate in the reader."""
        ...

    @abstractmethod
    async def update_firmware(self, firmware_file_path: str) -> Tuple[bool, str]:
        """Updates the firmware on the device."""
        ...
