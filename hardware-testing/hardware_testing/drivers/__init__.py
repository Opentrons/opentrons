"""The driver package."""
from serial.tools.list_ports import comports  # type: ignore[import]

from .radwag import RadwagScaleBase, RadwagScale, SimRadwagScale


def list_ports_and_select(device_name: str = "") -> str:
    """List serial ports and display list for user to select from."""
    ports = comports()
    assert ports, "no serial ports found"
    ports.sort(key=lambda p: p.device)
    print("found ports:")
    for i, p in enumerate(ports):
        print(f"\t{i + 1}) {p.device}")
    if not device_name:
        device_name = "desired"
    idx_str = input(
        f"\nenter number next to {device_name} port (or ENTER to re-scan): "
    )
    if not idx_str:
        return list_ports_and_select(device_name)
    try:
        idx = int(idx_str.strip())
        return ports[idx - 1].device
    except (ValueError, IndexError):
        return list_ports_and_select()


def find_port(vid: int, pid: int) -> str:
    """Find COM port from provided VIP:PID."""
    for port in comports():
        if port.pid == pid and port.vid == vid:
            return port.device
    raise RuntimeError(f"Unable to find serial " f"port for VID:PID={vid}:{pid}")


__all__ = [
    "list_ports_and_select",
    "find_port",
    "RadwagScaleBase",
    "RadwagScale",
    "SimRadwagScale",
    "AsairSensor",
    "AsairSensorError",
]
