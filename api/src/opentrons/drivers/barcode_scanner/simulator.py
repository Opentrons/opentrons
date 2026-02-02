from typing import Optional

from .abstract import AbstractBarcodeScannerDriver
from .types import BarcodeModuleInfo, LEDProfile, SoundProfile


class BarcodeSimulatorDriver(AbstractBarcodeScannerDriver):
    def __init__(self) -> None:
        self.connected = False
        self.prefix = ""
        self.suffix = ""
        self.scan_timeout = 1.0
        self.serial_number = "fake-serial"
        self.sound_profile = SoundProfile.FULL_SOUND
        self.led_profile = LEDProfile.SUCCESS_AND_FAILURE

    async def connect(self) -> None:
        """Connect to the barcode scanner."""
        self.connected = True

    async def disconnect(self) -> None:
        """Disconnect from the barcode scanner."""
        self.connected = False

    async def is_connected(self) -> bool:
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

    async def set_scan_timeout(self, timeout: float) -> None:
        """Set how long to run the decoder before timing out."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.scan_timeout = timeout

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

    async def set_led_profile(self, profile: LEDProfile) -> None:
        """Set the led profile."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        self.led_profile = profile

    async def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        if not self.connected:
            raise ConnectionError("Barcode scanner simulator not connected.")
        return BarcodeModuleInfo(serial=self.serial_number)
