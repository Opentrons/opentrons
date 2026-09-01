"""Connect to a robot over USB or Wi-Fi for app E2E test preflight checks."""

from __future__ import annotations

import json
import sys
from typing import Any, Optional

import httpx

from automation.app_helpers.robot_usb import find_opentrons_usb_port, http_get_over_serial

ROBOT_PORT = 31950
TIMEOUT = 10.0
DEFAULT_ROBOT_IP = "10.14.19.194"


class RobotConnection:
    """Callable stand-in for a robot IP address."""

    def __init__(self, *, usb_port: Optional[str] = None, ip: Optional[str] = None) -> None:
        """Store USB serial port or network IP used for robot-server requests."""
        self.usb_port = usb_port
        self.ip = ip

    @property
    def over_usb(self) -> bool:
        """Return True when requests should go over the USB serial port."""
        return self.usb_port is not None

    def __call__(self, path: str) -> dict[str, Any]:
        """GET a robot-server path and return JSON (e.g. connection('/health'))."""
        if self.over_usb:
            assert self.usb_port is not None
            status, body = http_get_over_serial(self.usb_port, path, TIMEOUT)
        else:
            url = f"http://{self.ip}:{ROBOT_PORT}{path}"
            with httpx.Client(headers={"Opentrons-Version": "*"}, timeout=TIMEOUT) as client:
                resp = client.get(url)
                resp.raise_for_status()
                return resp.json()

        if status != 200:
            raise RuntimeError(f"GET {path} failed: HTTP {status}\n{body.decode('utf-8', errors='replace')}")
        return json.loads(body.decode("utf-8"))


def connect_robot(default_ip: Optional[str] = None) -> RobotConnection:
    """USB first; otherwise connect over Wi-Fi. Returns a callable connection."""
    usb_port = find_opentrons_usb_port()
    if usb_port is not None:
        connection = RobotConnection(usb_port=usb_port)
        connection("/health")
        print(f"Connected over USB ({usb_port})")
        return connection

    ip = (default_ip or DEFAULT_ROBOT_IP).strip()
    connection = RobotConnection(ip=ip)
    connection("/health")
    print(f"Connected over network ({ip}:{ROBOT_PORT})")
    return connection


def main() -> int:
    """CLI entry point: connect over USB or Wi-Fi and print status."""
    try:
        connect_robot()
    except Exception as exc:
        print(exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
