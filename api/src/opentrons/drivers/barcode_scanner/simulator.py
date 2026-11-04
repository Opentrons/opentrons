from typing import Optional

from .abstract import AbstractBarcodeScannerDriver
from .types import BarcodeModuleInfo, SoundProfile


class BarcodeSimulatorDriver(AbstractBarcodeScannerDriver):
    def __init__(self) -> None:
        self.connected = False
        self.prefix = ""
        self.suffix = ""
        self.scan_timeout = 1000
        self.serial_number = "fake-serial"
        self.sound_profile = SoundProfile.FULL_SOUND
        self.connected = True

    async def connect(self) -> None:
        """Connect to the barcode scanner."""
        self.connected = True

    async def disconnect(self) -> None:
        """Disconnect from the barcode scanner."""
        self.connected = False

    def is_connected(self) -> bool:
        """Check connection to barcode scanner"""
        return self.connected

    async def set_prefix(self, prefix: str) -> None:
        """Set the automatic prefix for the barcode data."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.prefix = prefix

    async def set_suffix(self, suffix: str) -> None:
        """Set the automatic suffix for the barcode data."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.suffix = suffix

    async def set_scan_timeout(self, timeout_ms: int) -> None:
        """Set how long to run the decoder before timing out."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.scan_timeout = timeout_ms

    async def scan_barcode(self) -> Optional[str]:
        """Scan and return a barcode."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        return f"{self.prefix}FakeBarcodeData{self.suffix}"

    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.sound_profile = profile

    def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        return BarcodeModuleInfo(
            serial=self.serial_number,
            oem_serial="otserialnumber",
            manufacturing_date="2025-08-29",
            firmware_version="U6102.ST.T13S.4",
            decoder_version="IOTC0610",
            hardware_version="V1.2",
            product_name="R214",
            data_formating_version="3.06.049",
        )
