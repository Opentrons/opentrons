from typing import Dict, List, Optional, Tuple
from opentrons.util.async_helpers import ensure_yield

from opentrons.drivers.types import (
    ABSMeasurementMode,
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderDeviceState,
    AbsorbanceReaderPlatePresence,
)

from .abstract import AbstractAbsorbanceReaderDriver


class SimulatingDriver(AbstractAbsorbanceReaderDriver):
    def __init__(
        self, model: Optional[str] = None, serial_number: Optional[str] = None
    ) -> None:
        self._lid_status = AbsorbanceReaderLidStatus.ON
        self._model = model if model else "absorbanceReaderV1"
        self._serial_number = serial_number

    def model(self) -> str:
        return self._model

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
        return self._lid_status

    @ensure_yield
    async def get_available_wavelengths(self) -> List[int]:
        return [450, 570, 600, 650]

    @ensure_yield
    async def get_measurement(self) -> List[List[float]]:
        return [[0.0]]

    @ensure_yield
    async def initialize_measurement(
        self,
        wavelengths: List[int],
        mode: ABSMeasurementMode = ABSMeasurementMode.SINGLE,
        reference_wavelength: Optional[int] = None,
    ) -> None:
        pass

    @ensure_yield
    async def get_uptime(self) -> int:
        return 10

    @ensure_yield
    async def update_firmware(self, firmware_file_path: str) -> Tuple[bool, str]:
        return True, ""

    @ensure_yield
    async def get_status(self) -> AbsorbanceReaderDeviceState:
        return AbsorbanceReaderDeviceState.OK

    @ensure_yield
    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        return AbsorbanceReaderPlatePresence.PRESENT
