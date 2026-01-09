import serial # type: ignore[import-untyped]
from serial.tools.list_ports import comports  # type: ignore[import-untyped]
from typing import Optional

trigger = [22, 84, 13]
menu_prefix = [22, 77, 13]
menu_terminator = [46]
set_timeout = [ord(c) for c in "TRGSTO"]


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

    def set_scan_timeout(self, timeout: int) -> None:
        timeout_param = [ord(c) for c in str(timeout * 1000)]
        self.conn.write(menu_prefix + set_timeout + timeout_param + menu_terminator)
        self.conn.read_until(b".")
        self.conn.timeout = timeout

    def scan(self) -> Optional[str]:
        self.conn.write(trigger)
        barcode = self.conn.read_until(b"\r\n")
        return None if len(barcode) == 0 else barcode
