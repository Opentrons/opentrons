"""Mark10 Force Gauge Driver."""
from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod
from typing import Tuple

from random import uniform


class Mark10Base(ABC):
    """Base Class if Mark10 Force Gauge Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """Mark10 Force Gauge VID:PID."""
        # Check what's the VID and PID for this device
        return 0x0483, 0xA1AD

    @abstractmethod
    def connect(self) -> None:
        """Connect to the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def read_force(self) -> float:
        """Read Force in Newtons."""
        ...


class SimMark10(Mark10Base):
    """Simulating Mark 10 Driver."""

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def read_force(self) -> float:
        """Read Force."""
        return uniform(2.5, 2)


class Mark10(Mark10Base):
    """Mark10 Driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._force_guage = connection
        self._units = None

    @classmethod
    def create(cls, port: str, baudrate: int = 115200, timeout: float = 1) -> "Mark10":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return Mark10(connection=conn)

    def connect(self) -> None:
        """Connect."""
        self._force_guage.open()

    def disconnect(self) -> None:
        """Disconnect."""
        self._force_guage.close()

    def read_force(self) -> float:
        """Get Force in Newtons."""
        self._force_guage.flushInput()
        self._force_guage.flushOutput()
        self._force_guage.write("?\r\n".encode("utf-8"))
        reading = True
        while reading:
            (force_val, units) = self._force_guage.readline().strip().split()
            if force_val != b"":
                reading = False
        units = str(units, "utf-8")
        self._unit = units
        if units != "N":
            self._force_guage.write("N\r\n")  # Set force gauge units to Newtons
            print(
                f"Gauge units are not correct, expected 'N' currently is {units}. \
                        Please change units to N"
            )
        force_val = str(force_val, "utf-8")
        return float(force_val)
