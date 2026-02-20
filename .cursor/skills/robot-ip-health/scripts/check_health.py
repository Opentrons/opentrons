#!/usr/bin/env python3
"""Hit the robot health endpoint by IP address or over USB (Mac/Linux).

Requires: httpx (pip install httpx). For --usb: pyserial (pip install pyserial).

Usage:
    python check_health.py 10.14.19.233
    python check_health.py 10.14.19.233 --port 31950  # real robot
    python check_health.py 10.14.19.233 --update      # /server/update/health
    python check_health.py --usb                       # Flex/OT-3 connected via USB (macOS)
    python check_health.py --usb --update               # update server health over USB
"""

import argparse
import json
import re
import sys
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
        print(
            "For --usb, install pyserial: pip install pyserial",
            file=sys.stderr,
        )
        return None

    for port in comports():
        if (port.vid == OPENTRONS_USB_VID and port.pid == OPENTRONS_USB_PID):
            return port.device
    return None


def http_get_over_serial(port_path: str, path: str, timeout: float) -> tuple[int, bytes]:
    """Send HTTP GET over serial and return (status_code, body)."""
    import serial

    request = (
        f"GET {path} HTTP/1.1\r\n"
        "Host: localhost\r\n"
        "Opentrons-Version: *\r\n"
        "Connection: close\r\n"
        "\r\n"
    ).encode("ascii")

    with serial.Serial(
        port=port_path,
        baudrate=USB_SERIAL_BAUD,
        timeout=timeout,
        write_timeout=timeout,
    ) as ser:
        ser.write(request)
        ser.flush()

        # Read until we have headers (double CRLF)
        buf = b""
        while b"\r\n\r\n" not in buf and len(buf) < 8192:
            chunk = ser.read(256)
            if not chunk:
                break
            buf += chunk

        header_block = buf.split(b"\r\n\r\n", 1)[0].decode("ascii", errors="replace")
        rest = buf.split(b"\r\n\r\n", 1)[-1]

        # Parse status line
        first_line = header_block.split("\r\n")[0]
        status_match = re.search(r"HTTP/1\.\d+\s+(\d+)", first_line)
        status_code = int(status_match.group(1)) if status_match else 0

        # Content-Length
        cl_match = re.search(r"Content-Length:\s*(\d+)", header_block, re.IGNORECASE)
        if cl_match:
            want = int(cl_match.group(1))
            while len(rest) < want:
                rest += ser.read(want - len(rest))
            body = rest[:want]
        else:
            # Read remainder with timeout
            body = rest + ser.read(4096)

        return status_code, body


def _usb_summary_runs_pipettes_modules(port_path: str, timeout: float, health_body: bytes) -> str:
    """After /health succeeded, GET /runs, /instruments or /pipettes, /modules; return a one-line summary or empty string on failure."""
    parts = []
    try:
        health = json.loads(health_body.decode("utf-8"))
        robot_model = health.get("robot_model", "")
    except (json.JSONDecodeError, KeyError):
        robot_model = ""
    # Runs
    try:
        status, raw = http_get_over_serial(port_path, "/runs", timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = data.get("meta", {}).get("totalLength") or len(data.get("data", []))
        else:
            n = "?"
        parts.append(f"Runs: {n}")
    except Exception:
        parts.append("Runs: ?")
    # Instruments (OT-3) or Pipettes (OT-2)
    try:
        path = "/instruments" if "OT-3" in robot_model else "/pipettes"
        status, raw = http_get_over_serial(port_path, path, timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            if isinstance(data.get("data"), list):
                n = len(data["data"])
            else:
                n = sum(1 for v in data.values() if isinstance(v, dict) and (v.get("model") or v.get("name")))
        else:
            n = "?"
        label = "Instruments" if "OT-3" in robot_model else "Pipettes"
        parts.append(f"{label}: {n}")
    except Exception:
        parts.append("Instruments: ?" if "OT-3" in robot_model else "Pipettes: ?")
    # Modules
    try:
        status, raw = http_get_over_serial(port_path, "/modules", timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = len(data.get("data", [])) if isinstance(data.get("data"), list) else 0
        else:
            n = "?"
        parts.append(f"Modules: {n}")
    except Exception:
        parts.append("Modules: ?")
    return "  " + " | ".join(parts)


def run_usb_health_check(path: str, timeout: float) -> int:
    """Run health check over USB serial; print JSON and return exit code."""
    port_path = find_opentrons_usb_port()
    if port_path is None:
        print(
            "No Opentrons Flex/OT-3 USB device found. Connect the robot via USB and try again.",
            file=sys.stderr,
        )
        return 1
    try:
        status_code, body = http_get_over_serial(port_path, path, timeout)
    except OSError as e:
        if e.errno == 16:  # Resource busy
            print(
                f"USB port {port_path} is in use. Close the Opentrons app (or any other app using the robot USB) and try again.",
                file=sys.stderr,
            )
        else:
            print(f"USB serial error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"USB serial error: {e}", file=sys.stderr)
        return 1

    if status_code != 200:
        print(f"HTTP {status_code}", file=sys.stderr)
        print(body.decode("utf-8", errors="replace"), file=sys.stderr)
        return 1

    try:
        data = json.loads(body.decode("utf-8"))
        print(json.dumps(data, indent=2))
        if path == "/health":
            summary = _usb_summary_runs_pipettes_modules(port_path, timeout, body)
            if summary:
                print(summary, file=sys.stderr)
        return 0
    except json.JSONDecodeError as e:
        print(f"Response was not JSON: {e}", file=sys.stderr)
        print(body.decode("utf-8", errors="replace"), file=sys.stderr)
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check robot health by hitting the health endpoint (IP or USB)."
    )
    parser.add_argument(
        "ip",
        nargs="?",
        help="Robot IP address (omit when using --usb)",
    )
    parser.add_argument(
        "--usb",
        action="store_true",
        help="Use USB serial connection (Flex/OT-3 on macOS/Linux). Finds Opentrons USB device automatically.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=31950,
        help="Port for real robot (default: 31950, robot server). Use 34000 for local dev server. Ignored when using --usb.",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Hit /server/update/health instead of /health",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10)",
    )
    args = parser.parse_args()

    path = "/server/update/health" if args.update else "/health"

    if args.usb:
        return run_usb_health_check(path, args.timeout)

    if not args.ip:
        parser.error("Provide an IP address, or use --usb for USB connection.")
    url = f"http://{args.ip}:{args.port}{path}"

    try:
        import httpx
    except ImportError:
        print("Install httpx: pip install httpx", file=sys.stderr)
        return 1

    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=args.timeout,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            print(json.dumps(data, indent=2))
            return 0
    except httpx.HTTPStatusError as e:
        print(
            f"HTTP {e.response.status_code}: {e.response.reason_phrase}",
            file=sys.stderr,
        )
        print(e.response.text, file=sys.stderr)
        return 1
    except httpx.ConnectError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        return 1
    except httpx.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
