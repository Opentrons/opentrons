"""Implementation for talking to the RT214C scanner."""

import logging
from typing import ByteString, Optional

from serial.tools.list_ports import comports  # type: ignore[import-untyped]

from .abstract import AbstractBarcodeScannerDriver
from .smartscan_commands import (
    ack,
    scan_trigger,
    set_timeout_cmd,
    suffix_crlf,
)
from .types import BarcodeModuleInfo, SoundProfile
from opentrons.drivers.asyncio.communication.async_serial import (
    AsyncSerial,
)

log = logging.getLogger(__name__)


class SmartScanner(AbstractBarcodeScannerDriver):
    """Driver for the Smartscan sh-400."""

    @classmethod
    async def create(cls, port: Optional[str]) -> "SmartScanner":
        device = None
        ports = comports()
        if not port:
            for p in ports:
                # RT214c vid:pid AC90:3003
                if p.vid and p.vid == 0xAC90:
                    device = p.device
        else:
            for p in ports:
                if p.device == port and p.vid == 0xAC90:
                    device = port
        if device is None:
            raise RuntimeError("No smartscan scanner found.")
        read_timeout_ms = 4000
        connection = await AsyncSerial.create(
            port=device,
            baud_rate=115200,
            timeout=read_timeout_ms / 1000.0,
            write_timeout=0.5,
        )
        scanner = SmartScanner(connection, device, read_timeout_ms)
        await scanner.connect()
        return scanner

    def __init__(
        self, connection: AsyncSerial, device: str, read_timeout_ms: int = 4000
    ):
        """Search for and connect to a RT214C if one is present."""
        self._device = device
        self._timeout_ms = read_timeout_ms
        self._sound_profile = SoundProfile.OFF
        self._conn = connection
        self._prefix = ""
        self._suffix = ""

    async def connect(self) -> None:
        await self.set_scan_timeout(self._timeout_ms)
        # disable all weird suffix/prefix to start
        # await self.enable_suffix(False)
        # await self.enable_prefix(False)
        # await self._enable_aim_id(False)
        # await self._enable_code_id(False)
        # await self.set_sound_profile(self._sound_profile)
        # await self.set_menu_option(illumination_led_enable + bool_conv(True))
        # await self.set_menu_option(aiming_led_enable + bool_conv(True))
        await self._set_scan_terminator(
            b"\x0d\x0a"
        )  # End of Text non-printable character207
        await self._fetch_device_info()
        self._connected = True

    async def disconnect(self) -> None:
        await self._conn.close()
        self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    def calculate_checksum(self, data: bytes) -> bytes:
        total = 0
        remain = 0
        for i in range(0, len(data)):
            total += data[i]
        while (total >> 8) > 0:
            remain = total >> 8
            total = (total & 0xFF) + (total >> 8)
        return bytes([0xFF - remain, (~total & 0xFF) + 0x01 + remain])

    async def send_cmd(self, cmd: bytes) -> None:
        cmd = (len(cmd) + 1).to_bytes(1) + cmd
        cmd = cmd + self.calculate_checksum(cmd)
        await self._conn.write(cmd)
        await self._conn.read_until(bytes(ack))  # eat the ack response

    async def _set_scan_terminator(self, terminator: ByteString) -> None:
        self._scan_terminator = terminator
        await self.send_cmd(bytes(suffix_crlf))

    async def scan_barcode(self) -> Optional[str]:
        """Search for a barcode and return if found else None."""
        self._conn.reset_input_buffer()
        self._conn.reset_output_buffer()
        await self.send_cmd(bytes(scan_trigger))
        try:
            barcode: bytes = await self._conn.read_until(bytes(self._scan_terminator))
        except BaseException:
            log.exception("failed to scan")
            barcode = b""
        if barcode == ack:
            log.exception("Failed to scan")
            barcode = b""
        log.debug(f"Scanned {barcode.decode('ascii')}")
        if len(barcode) == 0:
            return None
        else:
            # strip off our internal terminator
            barcode = barcode[: -1 * len(self._scan_terminator)]
        return f"{self._prefix}{barcode.decode('ascii')}{self._suffix}"

    async def _fetch_device_info(self) -> None:
        serial = "fake serial for smartscan"
        fw_ver = "v4.0"
        decoder_ver = "v4.0"
        hw_ver = "v4.0"
        manuf_date = "2026"
        oem_sn = "123456"
        data_format_ver = "v4.0"
        product_name = "Smartscan sh400"

        self._device_info = BarcodeModuleInfo(
            serial=serial,
            oem_serial=oem_sn,
            manufacturing_date=manuf_date,
            firmware_version=fw_ver,
            decoder_version=decoder_ver,
            hardware_version=hw_ver,
            product_name=product_name,
            data_formating_version=data_format_ver,
        )

    def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        return self._device_info

    async def set_prefix(self, prefix: str) -> None:
        """Set the automatic prefix for the barcode data."""
        self._prefix = prefix

    async def set_suffix(self, suffix: str) -> None:
        """Set the automatic suffix for the barcode data."""
        self._suffix = suffix

    async def set_scan_timeout(self, timeout_ms: int) -> None:
        """Set how long to run the decoder before timing out."""
        assert 500 < timeout_ms < 25500
        arg_int = int(timeout_ms / 100)
        await self.send_cmd(bytes(set_timeout_cmd) + arg_int.to_bytes(1))

    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        pass
