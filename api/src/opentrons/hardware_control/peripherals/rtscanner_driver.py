"""Implementation for talking to the RT214C scanner."""

import logging
from typing import List, Optional

import serial  # type: ignore[import-untyped]
from serial.tools.list_ports import comports  # type: ignore[import-untyped]

from .rtscanner_commands import (
    ack,
    decode_timeout,
    enable_aim_id,
    enable_code_id_prefix,
    enable_custom_prefix,
    enable_custom_suffix,
    enable_terminating_suffix,
    good_read_beep_duration,
    good_read_beep_enable,
    good_read_beep_frequency,
    good_read_beep_volume,
    menu_prefix,
    menu_suffix,
    permanent_write,
    scan_trigger,
    set_custom_prefix,
    set_terminating_suffix,
)

log = logging.getLogger(__name__)


class RTScanner:
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
        self.conn = serial.Serial(device)
        self.set_scan_timeout(read_timeout_ms)
        # disable all weird suffix/prefix to start
        self.enable_suffix(False)
        self.enable_prefix(False)
        self._enable_aim_id(False)
        self._enable_code_id(False)
        self._set_scan_terminator([0x03])  # End of Text non-printable character

    def _enable_aim_id(self, enable: bool) -> None:
        self._aim_id_ena = enable
        arg = ord("1") if enable else ord("0")
        self.set_menu_option(enable_aim_id + [arg])

    def _enable_code_id(self, enable: bool) -> None:
        self._code_id_ena = enable
        arg = ord("1") if enable else ord("0")
        self.set_menu_option(enable_code_id_prefix + [arg])

    def _set_scan_terminator(self, terminator: List[int]) -> None:
        self._scan_terminator = terminator
        self.set_menu_option(enable_terminating_suffix + [ord("1")])
        self.set_menu_option(
            set_terminating_suffix + self.expand_ascii_args(terminator)
        )

    def set_menu_option(self, cmd: List[int]) -> None:
        """Wrap a given command in the structure needed to pass the setting to the device."""
        self.conn.write(menu_prefix + permanent_write + cmd + menu_suffix)
        recv = self.conn.read_until(bytes(menu_suffix))
        if len(recv) < 3 or recv[-3] == 0x06:
            log.exception(
                f"Error writing setting recieved {' '.join(f'{b:02x}' for b in recv)}."
            )

    def set_scan_timeout(self, timeout_ms: int) -> None:
        """Tell the scanner how long to keep decoding before failing."""
        assert timeout_ms <= 3000
        self.conn.timeout = timeout_ms / 1000.0
        timeout_param = [ord(c) for c in str(timeout_ms)]
        self.set_menu_option(decode_timeout + timeout_param)
        self.conn.timeout = timeout_ms / 1000.0

    def scan(self) -> Optional[str]:
        """Search for a barcode and return if found else None."""
        self.conn.write(scan_trigger)
        self.conn.read_until(bytes(ack))  # eat the ack response
        barcode = self.conn.read_until(bytes(self._scan_terminator))
        if len(barcode) == 0:
            return None
        else:
            # strip off our internal terminator
            barcode = barcode[: -1 * len(self._scan_terminator)]
        return None if len(barcode) == 0 else barcode

    def expand_ascii_args(self, byte_list: List[int]) -> List[int]:
        """Double encode ascii for some reason."""
        expanded = []
        bytes_str = [f"{b:02x}" for b in byte_list]
        for b in bytes_str:
            expanded += [ord(c) for c in b]
        return expanded

    def enable_prefix(self, enable: bool) -> None:
        """Enable a custom prefix."""
        arg = ord("1") if enable else ord("0")
        self.set_menu_option(enable_custom_prefix + [arg])

    def enable_suffix(self, enable: bool) -> None:
        """Enable a custom suffix."""
        arg = ord("1") if enable else ord("0")
        self.set_menu_option(enable_custom_suffix + [arg])

    def set_prefix(self, prefix: str) -> None:
        """Set the custom prefix."""
        self.enable_prefix(True)
        prefix_bytes = [ord(c) for c in prefix]
        assert len(prefix_bytes) <= 10
        self.set_menu_option(set_custom_prefix + self.expand_ascii_args(prefix_bytes))

    def set_suffix(self, suffix: str) -> None:
        """Set a custom suffix."""
        self.enable_suffix(True)
        suffix_bytes = [ord(c) for c in suffix]
        assert len(suffix_bytes) <= 10
        self.set_menu_option(
            set_terminating_suffix + self.expand_ascii_args(suffix_bytes)
        )

    def enable_success_beeps(
        self,
        enable: bool,
        level: int = 20,
        duration_ms: int = 80,
        frequency_hz: int = 2730,
    ) -> None:
        """Set the success UI settings."""
        if enable:
            # level must be between 1 and 20
            assert level in range(1, 21)
            # duration must be between 20 and 300
            assert duration_ms in range(20, 301)
            # frequency must be between 20 and 20000
            assert frequency_hz in range(20, 20000)
            self.set_menu_option(good_read_beep_enable + [ord("1")])
            self.set_menu_option(
                good_read_beep_duration + [ord(c) for c in str(duration_ms)]
            )
            self.set_menu_option(good_read_beep_volume + [ord(c) for c in str(level)])
            self.set_menu_option(
                good_read_beep_frequency + [ord(c) for c in str(frequency_hz)]
            )
        else:
            self.set_menu_option(good_read_beep_enable + [ord("0")])
