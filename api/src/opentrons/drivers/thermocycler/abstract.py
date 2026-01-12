from abc import ABC, abstractmethod
from typing import Dict, Optional

from opentrons.drivers.types import PlateTemperature, Temperature, ThermocyclerLidStatus


class AbstractThermocyclerDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to thermocycler"""
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
    async def lift_plate(self) -> None:
        """Send the Plate Lift command."""

    @abstractmethod
    async def get_lid_status(self) -> ThermocyclerLidStatus:
        """Send get lid status command"""
        ...

    @abstractmethod
    async def set_lid_temperature(self, temp: float) -> None:
        """Set the lid temperature"""
        ...

    @abstractmethod
    async def get_lid_temperature(self) -> Temperature:
        """Send a get lid temperature command."""
        ...

    @abstractmethod
    async def set_plate_temperature(
        self,
        temp: float,
        hold_time: Optional[float] = None,
        volume: Optional[float] = None,
        ramp_rate: Optional[float] = None,
    ) -> None:
        """Send set plate temperature command"""
        ...

    @abstractmethod
    async def get_plate_temperature(self) -> PlateTemperature:
        """Send a get plate temperature command."""
        ...

    @abstractmethod
    async def set_ramp_rate(self, ramp_rate: float) -> None:
        """Send a set ramp rate command"""
        ...

    @abstractmethod
    async def deactivate_all(self) -> None:
        """Send deactivate all command."""
        ...

    @abstractmethod
    async def deactivate_lid(self) -> None:
        """Send deactivate lid command"""
        ...

    @abstractmethod
    async def deactivate_block(self) -> None:
        """Send deactivate block command"""
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """Send get device info command"""
        ...

    @abstractmethod
    async def enter_programming_mode(self) -> None: ...

    @abstractmethod
    async def jog_lid(self, angle: float) -> None:
        """Send the Jog Lid command."""
        ...

    @abstractmethod
    async def get_error_state(self) -> None:
        """Raise if the thermocycler is in an error state."""
        ...
