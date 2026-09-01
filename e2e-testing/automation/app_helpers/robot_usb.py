"""Minimal USB helpers for robot-server HTTP over serial (used by app E2E tests)."""

from __future__ import annotations

import re
from typing import Optional

# Opentrons Flex/OT-3 USB identifiers (same as usb-bridge/node-client constants)
OPENTRONS_USB_VID = 0x1B67
OPENTRONS_USB_PID = 0x4037
# Baud rate used by app-shell SerialPortHttpAgent
USB_SERIAL_BAUD = 1_152_000


def find_opentrons_usb_port() -> Optional[str]:
    """Return the first serial port that matches Opentrons Flex USB VID/PID."""
    try:
        from serial.tools.list_ports import comports
    except ImportError:
        return None

    for port in comports():
        if port.vid == OPENTRONS_USB_VID and port.pid == OPENTRONS_USB_PID:
            return port.device
    return None


def http_get_over_serial(port_path: str, path: str, timeout: float) -> tuple[int, bytes]:
    """Send HTTP GET over serial and return (status_code, body)."""
    import serial

    request = (f"GET {path} HTTP/1.1\r\nHost: localhost\r\nOpentrons-Version: *\r\nConnection: close\r\n\r\n").encode(
        "ascii"
    )

    with serial.Serial(
        port=port_path,
        baudrate=USB_SERIAL_BAUD,
        timeout=timeout,
        write_timeout=timeout,
    ) as ser:
        ser.write(request)
        ser.flush()

        buf = b""
        while b"\r\n\r\n" not in buf and len(buf) < 8192:
            chunk = ser.read(256)
            if not chunk:
                break
            buf += chunk

        header_block = buf.split(b"\r\n\r\n", 1)[0].decode("ascii", errors="replace")
        rest = buf.split(b"\r\n\r\n", 1)[-1]

        first_line = header_block.split("\r\n")[0]
        status_match = re.search(r"HTTP/1\.\d+\s+(\d+)", first_line)
        status_code = int(status_match.group(1)) if status_match else 0

        cl_match = re.search(r"Content-Length:\s*(\d+)", header_block, re.IGNORECASE)
        if cl_match:
            want = int(cl_match.group(1))
            while len(rest) < want:
                rest += ser.read(want - len(rest))
            body = rest[:want]
        else:
            body = rest + ser.read(4096)

        return status_code, body
