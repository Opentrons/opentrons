"""Implementation for talking to the RT214C scanner."""

import logging
from os.path import realpath
from time import monotonic
from typing import ByteString, Optional

from serial.tools.list_ports import comports  # type: ignore[import-untyped]

from .abstract import AbstractBarcodeScannerDriver
from .smartscan_commands import (
    ack,
    scan_trigger,
    set_timeout_cmd,
    suffix_crlf,
    timeout_cmd_max,
    timeout_cmd_min,
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
                # SH-400 vid:pid AC90:3003
                if p.vid and p.vid == 0xAC90:
                    device = p.device
        else:
            for p in ports:
                if realpath(p.device) == realpath(port) and p.vid == 0xAC90:
                    device = p.device
        if device is None:
            raise RuntimeError("No scanner found.")
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
        """Search for and connect to a SH-400 if one is present."""
        self._device = device
        self._timeout_ms = read_timeout_ms
        self._sound_profile = SoundProfile.OFF
        self._conn = connection
        self._prefix = ""
        self._suffix = ""
        self._receive_buffer = b""

    async def connect(self) -> None:
        await self.set_scan_timeout(self._timeout_ms)
        await self._set_scan_terminator(b"\x0d\x0a")  # CRLF
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
        # Preserve data received while waiting for acknowledgement. Some scanners
        # send a different response, or a manually scanned barcode, here.
        self._receive_buffer += await self._conn.read_until(bytes(ack))

    async def _set_scan_terminator(self, terminator: ByteString) -> None:
        self._scan_terminator = terminator
        await self.send_cmd(bytes(suffix_crlf))

    async def scan_barcode(self) -> Optional[str]:
        """Search for a barcode and return if found else None."""
        command = (len(scan_trigger) + 1).to_bytes(1) + bytes(scan_trigger)
        await self._conn.write(command + self.calculate_checksum(command))
        read_timeout = self._timeout_ms / 1000
        idle_deadline = monotonic() + read_timeout
        hard_deadline = monotonic() + 2 * read_timeout
        while True:
            barcode = self._barcode_from_receive_buffer()
            if barcode is not None:
                return barcode
            remaining = min(idle_deadline, hard_deadline) - monotonic()
            if remaining <= 0:
                return None
            async with self._conn.timeout_override("timeout", remaining):
                chunk = await self._conn.read_until(bytes(self._scan_terminator))
            if not chunk:
                return None
            self._receive_buffer += chunk
            # A response frame or a fragmented barcode may consume the initial
            # timeout. Give newly received data time to complete, within the
            # hard limit for one scan attempt.
            idle_deadline = monotonic() + read_timeout

    def _barcode_from_receive_buffer(self) -> Optional[str]:
        """Remove scanner responses and return the first complete barcode."""
        # Responses are binary length-prefixed frames. Keep them separate from
        # CRLF-terminated barcode text, even across serial read chunks.
        while self._receive_buffer:
            data = self._receive_buffer
            if self._discard_response_frame():
                continue
            end = data.find(bytes(self._scan_terminator))
            if end < 0:
                return None
            barcode = data[:end]
            self._receive_buffer = data[end + len(self._scan_terminator) :]
            if barcode:
                return f"{self._prefix}{barcode.decode('ascii')}{self._suffix}"
        return None

    def _discard_response_frame(self) -> bool:
        """Discard one complete binary response frame, if present."""
        data = self._receive_buffer
        if len(data) < 2 or data[0] >= 0x20 or data[1] not in (0xD0, 0xD1):
            return False
        frame_size = data[0] + 2
        if len(data) < frame_size:
            return False
        frame = data[:frame_size]
        if self.calculate_checksum(frame[:-2]) != frame[-2:]:
            raise ValueError(f"Invalid scanner response checksum: {frame.hex()}")
        if frame != ack:
            log.warning("Unexpected scanner response: %s", frame.hex(" "))
        self._receive_buffer = data[frame_size:]
        return True

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
        assert timeout_cmd_min < timeout_ms < timeout_cmd_max
        arg_int = int(timeout_ms / 100)
        await self.send_cmd(bytes(set_timeout_cmd) + arg_int.to_bytes(1))

    # TODO: implement sound
    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        pass
