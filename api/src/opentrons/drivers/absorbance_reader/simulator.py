from typing import Dict, List, Optional
from opentrons.util.async_helpers import ensure_yield

from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderDeviceState,
)

from .abstract import AbstractAbsorbanceReaderDriver


class SimulatingDriver(AbstractAbsorbanceReaderDriver):
    def __init__(self, serial_number: Optional[str] = None) -> None:
        self._serial_number = serial_number

    @ensure_yield
    async def get_device_info(self) -> Dict[str, str]:
        """Get device info"""
        return {
            "serial": self._serial_number if self._serial_number else "dummySerialAR",
            "model": "dummyModelAR",
            "version": "dummyVersionAR",
        }

    @ensure_yield
    async def connect(self) -> None:
        """Connect to absorbance reader"""
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        """Disconnect from absorbance reader"""
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        """Check connection to absorbance reader"""
        return True

    @ensure_yield
    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        return AbsorbanceReaderLidStatus.ON

    @ensure_yield
    async def get_available_wavelengths(self) -> List[int]:
        return [450, 570, 600, 650]

    @ensure_yield
    async def get_single_measurement(self, wavelength: int) -> List[float]:
        return [0.0]

    @ensure_yield
    async def initialize_measurement(self, wavelength: int) -> None:
        pass

    @ensure_yield
    async def get_status(self) -> AbsorbanceReaderDeviceState:
        return AbsorbanceReaderDeviceState.OK
