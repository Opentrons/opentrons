"""Implementation for talking to the RT214C scanner."""

import logging
from typing import ByteString, Optional

import serial  # type: ignore[import-untyped]
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
    scan_trigger,
    set_custom_prefix,
    set_terminating_suffix,
)
from .types import BarcodeModuleInfo, SoundProfile

log = logging.getLogger(__name__)


class RTScanner(AbstractBarcodeScannerDriver):
    """Driver for the RTC214C."""

    def __init__(self, read_timeout_ms: int = 2000):
        """Search for and connect to a RT214C if one is present."""
        device = None
        for p in comports():
            # RT214c vid:pid 1eab:1d06
            if p.vid and p.vid == 0x1EAB:
                device = p.device
        if device is None:
            raise RuntimeError("No RT scanner found.")
        self._device = device
        self._timeout_ms = read_timeout_ms
        self._sound_profile = SoundProfile.OFF

    def connect(self) -> None:
        self.conn = serial.Serial(self._device)
        self._connected = True
        self.set_scan_timeout(self._timeout_ms)
        # disable all weird suffix/prefix to start
        self.enable_suffix(False)
        self.enable_prefix(False)
        self._enable_aim_id(False)
        self._enable_code_id(False)
        self.set_sound_profile(self._sound_profile)
        self.set_menu_option(illumination_led_enable + bool_conv(True))
        self.set_menu_option(aiming_led_enable + bool_conv(True))
        self._set_scan_terminator(b"\x03")  # End of Text non-printable character

    def disconnect(self) -> None:
        self.conn.close()
        self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    def _enable_aim_id(self, enable: bool) -> None:
        self._aim_id_ena = enable
        self.set_menu_option(enable_aim_id + bool_conv(enable))

    def _enable_code_id(self, enable: bool) -> None:
        self._code_id_ena = enable
        self.set_menu_option(enable_code_id_prefix + bool_conv(enable))

    def _set_scan_terminator(self, terminator: ByteString) -> None:
        self._scan_terminator = terminator
        self.set_menu_option(enable_terminating_suffix + bool_conv(True))
        self.set_menu_option(
            set_terminating_suffix + expand_ascii_args(terminator.decode("ascii"))  # type: ignore[union-attr]
        )

    def set_menu_option(self, cmd: ByteString) -> None:
        """Wrap a given command in the structure needed to pass the setting to the device."""
        cmd_bytes = bytes(menu_prefix + permanent_write + cmd + menu_suffix)
        log.debug(f"sending {' '.join(f'{b:02x}' for b in cmd_bytes)}")
        self.conn.write(cmd_bytes)
        recv = self.conn.read_until(bytes(menu_suffix))
        if len(recv) < 3 or recv[-3] != bytes(ack)[0]:
            log.exception(
                f"Error writing setting recieved {' '.join(f'{b:02x}' for b in recv)}."
            )
        log.debug(f"received {' '.join(f'{b:02x}' for b in recv)}")

    def set_scan_timeout(self, timeout_ms: int) -> None:
        """Tell the scanner how long to keep decoding before failing."""
        assert timeout_ms <= 3000
        self._timeout_ms = timeout_ms
        self.set_menu_option(decode_timeout + int_conv(timeout_ms))
        self.conn.timeout = timeout_ms / 1000.0

    def scan_barcode(self) -> Optional[str]:
        """Search for a barcode and return if found else None."""
        self.conn.write(bytes(scan_trigger))
        self.conn.read_until(bytes(ack))  # eat the ack response
        barcode: str = self.conn.read_until(bytes(self._scan_terminator))
        log.debug(f"Scanned {barcode}")
        if len(barcode) == 0:
            if self._do_err_beep:
                self.do_beep()
            return None
        else:
            # strip off our internal terminator
            barcode = barcode[: -1 * len(self._scan_terminator)]
        return barcode

    def enable_prefix(self, enable: bool) -> None:
        """Enable a custom prefix."""
        self.set_menu_option(enable_custom_prefix + bool_conv(enable))

    def enable_suffix(self, enable: bool) -> None:
        """Enable a custom suffix."""
        self.set_menu_option(enable_custom_suffix + bool_conv(enable))

    def set_prefix(self, prefix: str) -> None:
        """Set the custom prefix."""
        self.enable_prefix(True)
        prefix_bytestr = expand_ascii_args(prefix)
        assert len(prefix_bytestr) <= 10
        self.set_menu_option(set_custom_prefix + prefix_bytestr)

    def set_suffix(self, suffix: str) -> None:
        """Set a custom suffix."""
        self.enable_suffix(True)

        suffix_bytestr = expand_ascii_args(suffix)
        assert len(suffix_bytestr) <= 10
        self.set_menu_option(set_terminating_suffix + suffix_bytestr)

    def enable_success_beeps(
        self,
        enable: bool,
        level: int = 20,
        duration_ms: int = 80,
        frequency_hz: int = 2730,
    ) -> None:
        """Set the success UI settings."""
        self.set_menu_option(good_read_beep_enable + bool_conv(enable))
        if enable:
            # level must be between 1 and 20
            assert level in range(1, 21)
            # duration must be between 20 and 300
            assert duration_ms in range(20, 301)
            # frequency must be between 20 and 20000
            assert frequency_hz in range(20, 20000)
            self.set_menu_option(good_read_beep_duration + int_conv(duration_ms))
            self.set_menu_option(good_read_beep_volume + int_conv(level))
            self.set_menu_option(good_read_beep_frequency + int_conv(frequency_hz))

    def do_beep(
        self, level: int = 20, duration_ms: int = 80, frequency_hz: int = 2730
    ) -> None:
        # level must be between 1 and 20
        assert level in range(1, 21)
        # duration must be between 20 and 10000
        assert duration_ms in range(20, 10000)
        # frequency must be between 1 and 20000
        assert frequency_hz in range(20, 20000)
        self.set_menu_option(
            do_beep
            + int_conv(frequency_hz)
            + b"F"
            + int_conv(duration_ms)
            + b"T"
            + int_conv(level)
            + b"V"
        )

    def set_sound_profile(self, profile: SoundProfile) -> None:
        """Set the sound profile."""
        self._do_err_beep = profile in [
            SoundProfile.FULL_SOUND,
            SoundProfile.ONLY_ERROR,
        ]
        self.enable_success_beeps(enable=profile == SoundProfile.FULL_SOUND)

    def get_device_info(self) -> BarcodeModuleInfo:
        """Get Device Info."""
        return BarcodeModuleInfo(serial="Fake serial.")
