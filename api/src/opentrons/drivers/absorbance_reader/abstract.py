from abc import ABC, abstractmethod
from typing import Dict
from opentrons.drivers.types import AbsorbanceReaderLidStatus


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
    async def get_available_wavelengths(self) -> Dict[int, bool]:
        ...

    @abstractmethod
    async def get_single_measurement(self, wavelength: int) -> float:
        ...
    
    @abstractmethod
    async def set_sample_wavelength(self, wavelength: int) -> None:
        ...
    
    @abstractmethod
    async def get_status(self) -> None:
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """Get device info"""
        ...