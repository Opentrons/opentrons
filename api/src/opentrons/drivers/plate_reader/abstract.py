from abc import ABC, abstractmethod
from typing import Optional, Dict, List


class AbstractPlateReaderDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to plate reader"""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from thermocycler"""
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        """Check connection"""
        ...

    @abstractmethod
    async def open_lid(self) -> None:
        """Send open lid command"""
        ...

    @abstractmethod
    async def close_lid(self) -> None:
        """Send close lid command"""
        ...

    @abstractmethod
    async def get_lid_status(self) -> bool:
        """Send get lid status command"""
        ...

    @abstractmethod
    async def set_wavelength(self, wavelength_nm: float) -> None:
        """Set the wavelength."""
        ...

    @abstractmethod
    async def get_wavelength(self) -> float:
        """Send a get wavelength command."""
        ...

    @abstractmethod
    async def get_plate_status(self) -> bool:
        """Send get plate status command."""
        ...

    @abstractmethod
    async def get_supported_wavelength(self) -> List[int]:
        """Send get supported wavelength command."""
        ...


    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """Send get device info command."""
        ...
