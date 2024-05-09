from typing import Dict, Protocol, List, TypeVar
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
)


HidDevice = TypeVar("HidDevice")
HidDeviceHandle = TypeVar("HidDeviceHandle")


class HidInterface(Protocol):
    async def open(self) -> None:
        ...

    async def close(self) -> None:
        ...

    async def is_open(self) -> bool:
        ...

    async def get_device_information(self) -> Dict[str, str]:
        ...

    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        ...

    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        ...

    async def get_supported_wavelengths(self) -> List[int]:
        ...

    async def initialize(self, wavelength: int) -> None:
        ...

    async def get_single_measurement(self, wavelength: int) -> List[float]:
        ...
