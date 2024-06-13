from __future__ import annotations

import asyncio
from typing import Dict, Optional, List, TYPE_CHECKING

from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderDeviceState,
    AbsorbanceReaderPlatePresence,
)
from opentrons.drivers.absorbance_reader.abstract import AbstractAbsorbanceReaderDriver
from opentrons.drivers.rpi_drivers.types import USBPort

if TYPE_CHECKING:
    from .async_byonoy import AsyncByonoy as AsyncByonoyType


class AbsorbanceReaderDriver(AbstractAbsorbanceReaderDriver):
    @classmethod
    async def create(
        cls,
        port: str,
        usb_port: USBPort,
        loop: Optional[asyncio.AbstractEventLoop],
    ) -> AbsorbanceReaderDriver:
        """Create an absorbance reader driver."""
        from .async_byonoy import AsyncByonoy

        connection = await AsyncByonoy.create(port=port, usb_port=usb_port, loop=loop)
        return cls(connection=connection)

    def __init__(self, connection: AsyncByonoyType) -> None:
        self._connection = connection

    async def get_device_info(self) -> Dict[str, str]:
        """Get device info"""
        connected = await self.is_connected()
        if not connected:
            info = await self._connection.get_device_static_info()
        else:
            info = await self._connection.get_device_information()
        return info

    async def connect(self) -> None:
        """Connect to absorbance reader"""
        await self._connection.open()

    async def disconnect(self) -> None:
        """Disconnect from absorbance reader"""
        await self._connection.close()

    async def is_connected(self) -> bool:
        """Check connection to absorbance reader"""
        return await self._connection.is_open()

    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        return await self._connection.get_lid_status()

    async def get_available_wavelengths(self) -> List[int]:
        return await self._connection.get_supported_wavelengths()

    async def get_single_measurement(self, wavelength: int) -> List[float]:
        return await self._connection.get_single_measurement(wavelength)

    async def initialize_measurement(self, wavelength: int) -> None:
        await self._connection.initialize(wavelength)

    async def get_status(self) -> AbsorbanceReaderDeviceState:
        return await self._connection.get_device_status()

    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        return await self._connection.get_plate_presence()
