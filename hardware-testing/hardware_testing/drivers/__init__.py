"""The driver package."""
from serial.tools.list_ports import comports  # type: ignore[import]

from .radwag import RadwagScaleBase, RadwagScale, SimRadwagScale
from .asair_sensor import AsairSensor, AsairSensorError


def find_port(vid: int, pid: int) -> str:
    """Find COM port from provided VIP:PID"""
    for port in comports():
        if port.pid == pid and port.vid == vid:
            return port.device
    raise RuntimeError(f"Unable to find serial " f"port for VID:PID={vid}:{pid}")


__all__ = [
    "find_port",
    "RadwagScaleBase",
    "RadwagScale",
    "SimRadwagScale",
    "AsairSensor",
    "AsairSensorError",
]
