"""The driver package."""
from typing import Callable, Optional

from serial import Serial  # type: ignore[import]
from serial.tools.list_ports import comports  # type: ignore[import]

from .radwag import RadwagScaleBase, RadwagScale, SimRadwagScale


def list_ports_and_select(device_name: str = "", port_substr: str = "") -> str:
    """List serial ports and display list for user to select from."""
    ports = comports()
    assert ports, "no serial ports found"
    ports.sort(key=lambda p: p.device)
    print("found ports:")

    idx = 0
    idx_str = ""
    for i, p in enumerate(ports):
        print(f"\t{i + 1}) {p.device}")
    if port_substr:
        for i, p in enumerate(ports):
            if port_substr in p.device:
                return p.device

    while True:
        idx_str = input(
            f"\nEnter number next to {device_name} port (or ENTER to re-scan): "
        )
        if not idx_str:
            return list_ports_and_select(device_name, port_substr)

        try:
            idx = int(idx_str.strip())
            return ports[idx - 1].device
        except (ValueError, IndexError):
            print("Invalid selection. Please try again.")


def find_port(vid: int, pid: int) -> str:
    """Find COM port from provided VIP:PID."""
    for port in comports():
        if port.pid == pid and port.vid == vid:
            return port.device
    raise RuntimeError(f"Unable to find serial " f"port for VID:PID={vid}:{pid}")


def search_for_port_with_filter(filter_cb: Callable, baudrate: int = 115200) -> Optional[str]:
    available_port_names = [p.device for p in comports()]
    test_port = Serial(port=None, baudrate=baudrate)
    for port_name in available_port_names:
        try:
            test_port.port = port_name
            test_port.open()
            if filter_cb(test_port):
                return port_name
        except Exception as e:
            print(e)
            continue
        finally:
            if test_port.is_open:
                test_port.close()
    return None


__all__ = [
    "list_ports_and_select",
    "find_port",
    "RadwagScaleBase",
    "RadwagScale",
    "SimRadwagScale",
]
