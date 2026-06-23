"""Implementation for talking to the RT214C scanner."""

import logging
from typing import ByteString, Optional

from serial.tools.list_ports import comports  # type: ignore[import-untyped]

from .abstract import AbstractBarcodeScannerDriver
from .rtscanner_commands import (
    ack,
    aiming_led_enable,
    bool_conv,
    decode_timeout,
    do_beep,
    enable_aim_id,
    enable_code_id_prefix,
    enable_custom_prefix,
    enable_custom_suffix,
    enable_terminating_suffix,
    expand_ascii_args,
    good_read_beep_duration,
    good_read_beep_enable,
    good_read_beep_frequency,
    good_read_beep_volume,
    illumination_led_enable,
    int_conv,
    menu_prefix,
    menu_suffix,
    permanent_write,
    request_data_format_ver,
    request_decoder_ver,
    request_fw_ver,
    request_hw_ver,
    request_manuf_date,
    request_oem_sn,
    request_product_name,
    request_serial,
    scan_trigger,
    set_custom_prefix,
    set_custom_suffix,
    set_terminating_suffix,
)
from .types import BarcodeModuleInfo, SoundProfile
from opentrons.drivers.asyncio.communication.async_serial import (
    AsyncSerial,
)

log = logging.getLogger(__name__)


class RTScanner(AbstractBarcodeScannerDriver):
    """Driver for the RTC214C."""

    @classmethod
    async def create(cls, port: Optional[str]) -> "RTScanner":
        device = None
        ports = comports()
        if not port:
            for p in ports:
                # RT214c vid:pid 1eab:1d06
                if p.vid and p.vid == 0x1EAB:
                    device = p.device
        else:
            for p in ports:
                if p.device == port and p.vid == 0xAC90:
                    device = port
        if device is None:
            raise RuntimeError("No smartscan scanner found.")
        read_timeout_ms = 3000
        connection = await AsyncSerial.create(
            port=device,
            baud_rate=9600,
            timeout=read_timeout_ms / 1000.0,
            write_timeout=0.5,
        )
        scanner = RTScanner(connection, device, read_timeout_ms)
        await scanner.connect()
        return scanner

    def __init__(
        self, connection: AsyncSerial, device: str, read_timeout_ms: int = 3000
    ):
        """Search for and connect to a RT214C if one is present."""
        self._device = device
        self._timeout_ms = read_timeout_ms
        self._sound_profile = SoundProfile.OFF
        self._conn = connection

    async def connect(self) -> None:
        await self.set_scan_timeout(self._timeout_ms)
        # disable all weird suffix/prefix to start
        await self.enable_suffix(False)
        await self.enable_prefix(False)
        await self._enable_aim_id(False)
        await self._enable_code_id(False)
        await self.set_sound_profile(self._sound_profile)
        await self.set_menu_option(illumination_led_enable + bool_conv(True))
        await self.set_menu_option(aiming_led_enable + bool_conv(True))
        await self._set_scan_terminator(
            b"\x03"
        )  # End of Text non-printable character207
        await self._fetch_device_info()
        self._connected = True

    async def disconnect(self) -> None:
        await self._conn.close()
        self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    async def _enable_aim_id(self, enable: bool) -> None:
        self._aim_id_ena = enable
        await self.set_menu_option(enable_aim_id + bool_conv(enable))

    async def _enable_code_id(self, enable: bool) -> None:
        self._code_id_ena = enable
        await self.set_menu_option(enable_code_id_prefix + bool_conv(enable))

    async def _set_scan_terminator(self, terminator: ByteString) -> None:
        self._scan_terminator = terminator
        await self.set_menu_option(enable_terminating_suffix + bool_conv(True))
        await self.set_menu_option(
            set_terminating_suffix + expand_ascii_args(terminator.decode("ascii"))  # type: ignore[union-attr]
        )

    async def set_menu_option(self, cmd: ByteString) -> None:
        """Wrap a given command in the structure needed to pass the setting to the device."""
        cmd_bytes = bytes(menu_prefix + permanent_write + cmd + menu_suffix)
        log.debug(f"sending {' '.join(f'{b:02x}' for b in cmd_bytes)}")
        await self._conn.write(cmd_bytes)
        recv = await self._conn.read_until(bytes(menu_suffix))
        if len(recv) < 3 or recv[-3] != bytes(ack)[0]:
            log.exception(
                f"Error writing setting recieved {' '.join(f'{b:02x}' for b in recv)}."
            )
        log.debug(f"received {' '.join(f'{b:02x}' for b in recv)}")

    async def set_scan_timeout(self, timeout_ms: int) -> None:
        """Tell the scanner how long to keep decoding before failing."""
        assert timeout_ms <= 3000
        self._timeout_ms = timeout_ms
        await self.set_menu_option(decode_timeout + int_conv(timeout_ms))
        await self._conn.set_timeout("timeout", timeout_ms / 1000.0)

    async def scan_barcode(self) -> Optional[str]:
        """Search for a barcode and return if found else None."""
        await self._conn.write(bytes(scan_trigger))
        await self._conn.read_until(bytes(ack))  # eat the ack response
        try:
            barcode: bytes = await self._conn.read_until(bytes(self._scan_terminator))
        except BaseException:
            log.exception("failed to scan")
            barcode = b""
        log.debug(f"Scanned {barcode.decode('ascii')}")
        if len(barcode) == 0:
            if self._do_err_beep:
                await self.do_beep()
            return None
        else:
            # strip off our internal terminator
            barcode = barcode[: -1 * len(self._scan_terminator)]
        return barcode.decode("ascii")

    async def enable_prefix(self, enable: bool) -> None:
        """Enable a custom prefix."""
        await self.set_menu_option(enable_custom_prefix + bool_conv(enable))

    async def enable_suffix(self, enable: bool) -> None:
        """Enable a custom suffix."""
        await self.set_menu_option(enable_custom_suffix + bool_conv(enable))

    async def set_prefix(self, prefix: str) -> None:
        """Set the custom prefix."""
        await self.enable_prefix(True)
        prefix_bytestr = expand_ascii_args(prefix)
        assert len(prefix_bytestr) <= 10
        await self.set_menu_option(set_custom_prefix + prefix_bytestr)

    async def set_suffix(self, suffix: str) -> None:
        """Set a custom suffix."""
        await self.enable_suffix(True)

        suffix_bytestr = expand_ascii_args(suffix)
        assert len(suffix_bytestr) <= 10
        await self.set_menu_option(set_custom_suffix + suffix_bytestr)

    async def enable_success_beeps(
        self,
        enable: bool,
        level: int = 20,
        duration_ms: int = 80,
        frequency_hz: int = 2730,
    ) -> None:
        """Set the success UI settings."""
        await self.set_menu_option(good_read_beep_enable + bool_conv(enable))
        if enable:
            # level must be between 1 and 20
            assert level in range(1, 21)
            # duration must be between 20 and 300
            assert duration_ms in range(20, 301)
            # frequency must be between 20 and 20000
            assert frequency_hz in range(20, 20000)
            await self.set_menu_option(good_read_beep_duration + int_conv(duration_ms))
            await self.set_menu_option(good_read_beep_volume + int_conv(level))
            await self.set_menu_option(
                good_read_beep_frequency + int_conv(frequency_hz)
            )

    async def do_beep(
        self, level: int = 20, duration_ms: int = 80, frequency_hz: int = 2730
    ) -> None:
        # level must be between 1 and 20
        assert level in range(1, 21)
        # duration must be between 20 and 10000
        assert duration_ms in range(20, 10000)
        # frequency must be between 1 and 20000
        assert frequency_hz in range(20, 20000)
        await self.set_menu_option(
            do_beep
            + int_conv(frequency_hz)
            + b"F"
            + int_conv(duration_ms)
            + b"T"
            + int_conv(level)
            + b"V"
        )

    async def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        self._do_err_beep = profile in [
            SoundProfile.FULL_SOUND,
            SoundProfile.ONLY_ERROR,
        ]
        await self.enable_success_beeps(enable=profile == SoundProfile.FULL_SOUND)

    async def _fetch_info(self, tag: ByteString) -> str:
        cmd_bytes = bytes(menu_prefix + permanent_write + tag + menu_suffix)
        await self._conn.write(cmd_bytes)
        recv = await self._conn.read_until(bytes(menu_suffix))
        if len(recv) < 3 or recv[-3] != bytes(ack)[0]:
            log.exception(
                f"Error writing setting recieved {' '.join(f'{b:02x}' for b in recv)}."
            )
        relevant_data: str = (
            recv[13:-3].decode("ascii").strip()
        )  # remove the 6 char header, 7 char command echo and 3 char tail
        return relevant_data

    async def _fetch_device_info(self) -> None:
        serial = await self._fetch_info(request_serial)
        fw_ver = await self._fetch_info(request_fw_ver)
        decoder_ver = await self._fetch_info(request_decoder_ver)
        hw_ver = await self._fetch_info(request_hw_ver)
        manuf_date = await self._fetch_info(request_manuf_date)
        oem_sn = await self._fetch_info(request_oem_sn)
        data_format_ver = await self._fetch_info(request_data_format_ver)
        product_name = await self._fetch_info(request_product_name)

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
