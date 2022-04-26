from abc import ABC, abstractmethod
from typing import Dict

from opentrons.drivers.types import Temperature, RPM, HeaterShakerLabwareLatchStatus


class AbstractHeaterShakerDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to heater-shaker"""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from heater-shaker"""
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        """Check connection to heater-shaker"""
        ...

    @abstractmethod
    async def open_labware_latch(self) -> None:
        """Send open-labware-latch command"""
        ...

    @abstractmethod
    async def close_labware_latch(self) -> None:
        """Send close-labware-latch command"""
        ...

    @abstractmethod
    async def set_temperature(self, temperature: float) -> None:
        """Send set-temperature command"""
        ...

    @abstractmethod
    async def get_temperature(self) -> Temperature:
        """Send get-temperature command"""
        ...

    @abstractmethod
    async def set_rpm(self, rpm: int) -> None:
        """Send set-rpm command"""
        ...

    @abstractmethod
    async def get_rpm(self) -> RPM:
        """Send get-rpm command"""
        ...

    @abstractmethod
    async def get_labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        """Send get-labware-latch-status command"""
        ...

    @abstractmethod
    async def home(self) -> None:
        """Send deactivate shaker command"""
        ...

    @abstractmethod
    async def deactivate_heater(self) -> None:
        """Send deactivate heater command"""
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """Send get device info command"""
        ...

    @abstractmethod
    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        ...
