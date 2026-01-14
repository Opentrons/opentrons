import serial # type: ignore[import-untyped]
from serial.tools.list_ports import comports  # type: ignore[import-untyped]
from typing import Optional, List

trigger = [22, 84, 13]
menu_prefix = [22, 77, 13]
temporary_write = [46]
permanent_write = [33]

set_timeout = [ord(c) for c in "TRGSTO"]
enable_good_beep  = [ord(c) for c in "BEPBEP1"]
disable_good_beep  = [ord(c) for c in "BEPBEP0"]
good_beeper_level = [ord(c) for c in "BEPLVL"]
set_good_beeps = [ord(c) for c in "BEPRPT"]
set_bad_beeps = [ord(c) for c in "BEPERR"]
set_bad_pitch = [ord(c) for c in "PEPFQ2"]
add_prefix = [ord(c) for c in "PREBK2"]
clear_prefix = [ord(c) for c in "PRECA2"]
add_suffix = [ord(c) for c in "SUFBK2"]
clear_suffix = [ord(c) for c in "SUFCA2"]



class HoneywellScanner:
    def __init__(self, read_timeout: int = 2):
        device = None
        for p in comports():
            # honeywell
            if p.vid and p.vid == 0x0C2E:
                device = p.device
        if device is None:
            raise RuntimeError("No honeywell scanner found.")
        self.conn = serial.Serial(device)
        self.set_scan_timeout(read_timeout)
        self.set_suffix("\r\n")
        self.clear_prefix()

    def set_menu_option(self, cmd: List[int]) -> None:
        self.conn.write(menu_prefix + cmd + temporary_write)
        self.conn.read_until(b".")

    def set_scan_timeout(self, timeout: int) -> None:
        timeout_param = [ord(c) for c in str(timeout * 1000)]
        self.set_menu_option(set_timeout + timeout_param)
        self.conn.timeout = timeout

    def scan(self) -> Optional[str]:
        self.conn.write(trigger)
        barcode = self.conn.read_until(self._scan_terminator)
        return None if len(barcode) == 0 else barcode

    def clear_prefix(self) -> None:
        self.set_menu_option(clear_prefix)

    def clear_suffix(self) -> None:
        self.set_menu_option(clear_suffix)

    def set_prefix(self, prefix: str) -> None:
        prefix_bytes = [ord(c) for c in prefix]
        assert len(prefix_bytes) <= 2
        self.clear_prefix()
        self.set_menu_option(add_prefix + prefix_bytes)

    def set_suffix(self, suffix: str) -> None:
        suffix_bytes = [ord(c) for c in suffix]
        assert len(suffix_bytes) <= 2
        self.clear_suffix()
        self.set_menu_option(add_suffix + suffix_bytes)
        self._scan_terminator = suffix_bytes

    def enable_success_beeps(self, enable: bool, level: int = 1, num_beeps: int = 1):
        if enable:
            # level must be between 1 and 4
            assert level in range(1,5)
            # beeps must be between 1 and 9
            assert num_beeps in range(1,10)
            self.set_menu_option(enable_good_beep)
            self.set_menu_option(set_good_beeps + ord(num_beeps))
            self.set_menu_option(good_beeper_level + ord(level))
        else:
            self.set_menu_option(disable_good_beep)

    def enable_bad_scan_beeps(self, enable: bool, hz: int = 250, num_beeps: int = 2):
        if enable:
            assert num_beeps in range(1,10)
            assert hz in range(200,9001)
            pitch_arg = [ord(c) for c in str(hz)]
            self.set_menu_option(set_bad_beeps + ord(num_beeps))
            self.set_menu_option(set_bad_pitch + pitch_arg)
        else:
            self.set_menu_option(good_beeper_level + ord(0))
