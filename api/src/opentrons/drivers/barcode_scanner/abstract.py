from abc import ABC, abstractmethod
from typing import Optional

from .types import BarcodeModuleInfo, SoundProfile


class AbstractBarcodeScannerDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Connect to the barcode scanner."""

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from the barcode scanner."""

    @abstractmethod
    def is_connected(self) -> bool:
        """Check connection to barcode scanner"""
        ...

    @abstractmethod
    async def set_prefix(self, prefix: str) -> None:
        """Set the automatic prefix for the barcode data."""
        ...

    @abstractmethod
    async def set_suffix(self, suffix: str) -> None:
        """Set the automatic suffix for the barcode data."""
        ...

    @abstractmethod
    async def set_scan_timeout(self, timeout_ms: int) -> None:
        """Set how long to run the decoder before timing out."""
        ...

    # Scan barcode currently returns an optional instead of raising an error, this is due to a lack
    # of error recovery in the engine for now, being an unsupported product.
    # in order to have any kind of non-protocol-killing recovery we need to return None here from
    # a failure so the protocol can handle it on it's own.
    # TODO: make this raise an error if we implement error recovery in the engine.
    @abstractmethod
    async def scan_barcode(self) -> Optional[str]:
        """Scan and return a barcode."""
        ...

    @abstractmethod
    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        ...

    @abstractmethod
    def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        ...
