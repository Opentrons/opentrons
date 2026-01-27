from abc import ABC, abstractmethod
from typing import Optional

from .types import BarcodeModuleInfo, LEDProfile, SoundProfile


class AbstractBarcodeScannerDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to the barcode scanner."""

    @abstractmethod
    async def disconnect(self) -> None:
        """Disonnect from the barcode scanner."""

    @abstractmethod
    async def is_connected(self) -> bool:
        """Check connection to barcode scanner"""
        ...

    @abstractmethod
    async def set_prefix(self, prefix: str) -> None:
        """Set the automatic prefix for the barcode data."""
        ...

    @abstractmethod
    async def set_sufix(self, suffix: str) -> None:
        """Set the automatic suffix for the barcode data."""
        ...

    @abstractmethod
    async def scan_barcode(self) -> Optional[str]:
        """Scan and return a barcode."""
        ...

    @abstractmethod
    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        ...

    @abstractmethod
    async def set_led_profile(self, profile: LEDProfile) -> None:
        """Set the led profile."""
        ...

    @abstractmethod
    async def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        ...
