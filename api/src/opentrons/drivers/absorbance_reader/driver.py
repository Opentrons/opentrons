from __future__ import annotations

import asyncio
from typing import Dict, Optional, List

from opentrons.drivers.types import AbsorbanceReaderLidStatus
from opentrons.drivers.absorbance_reader.abstract import AbstractAbsorbanceReaderDriver


class AbsorbanceReaderDriver(AbstractAbsorbanceReaderDriver):
    @classmethod
    async def create(
        cls,
        port: str,
        loop: Optional[asyncio.AbstractEventLoop],
    ) -> AbsorbanceReaderDriver:
        """Create an absorbance reader driver."""
        loop = asyncio.get_running_loop() if not loop else loop
        return cls(loop)
    
    def __init__(self, loop: Optional[asyncio.AbstractEventLoop]) -> None:
        self._loop = loop
        
    async def get_device_info(self) -> Dict[str, str]:
        """Get device info"""
        return {}

    async def connect(self) -> None:
        """Connect to absorbance reader"""
        pass

    async def disconnect(self) -> None:
        """Disconnect from absorbance reader"""
        pass

    async def is_connected(self) -> bool:
        """Check connection to absorbance reader"""
        return True

    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        return AbsorbanceReaderLidStatus.ON

    async def get_available_wavelengths(self):
        return []

    async def get_single_measurement(self, wavelength: int) -> float:
        return 0.0
    
    async def set_sample_wavelength(self, wavelength: int) -> None:
        pass
    
    async def get_status(self) -> None:
        pass
