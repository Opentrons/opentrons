"""Mark10 Force Gauge Driver."""
from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod
from time import time
from typing import Tuple


class Mark10Base(ABC):
    """Base Class if Mark10 Force Gauge Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """Mark10 Force Gauge VID:PID."""
        # Check what's the VID and PID for this device
        return 0x0483, 0xA1AD

    @abstractmethod
    def is_simulator(self) -> bool:
        """Is this a simulation."""
        ...

    @abstractmethod
    def connect(self) -> None:
        """Connect to the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def read_force(self, timeout: float = 1.0) -> float:
        """Read Force in Newtons."""
        ...


class SimMark10(Mark10Base):
    """Simulating Mark 10 Driver."""

    def __init__(self) -> None:
        """Simulating Mark 10 Driver."""
        self._sim_force = 0.0
        super().__init__()

    def is_simulator(self) -> bool:
        """Is a simulator."""
        return True

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def read_force(self, timeout: float = 1.0) -> float:
        """Read Force."""
        return self._sim_force

    def set_simulation_force(self, force: float) -> None:
        """Set simulation force."""
        self._sim_force = force


class Mark10(Mark10Base):
    """Mark10 Driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._force_guage = connection
        self._units = None

    @classmethod
    def create(cls, port: str, baudrate: int = 115200, timeout: float = 1) -> "Mark10":
        """Create a Mark10 driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return Mark10(connection=conn)

    def is_simulator(self) -> bool:
        """Is simulator."""
        return False

    def connect(self) -> None:
        """Connect."""
        self._force_guage.open()

    def disconnect(self) -> None:
        """Disconnect."""
        self._force_guage.close()

    def read_force(self, timeout: float = 1.0) -> float:
        """Get Force in Newtons."""
        self._force_guage.write("?\r\n".encode("utf-8"))
        start_time = time()
        while time() < start_time + timeout:
            # return "12.3 N"
            line = self._force_guage.readline().decode("utf-8").strip()
            try:
                force_val, units = line.split(" ")
                if units != "N":
                    self._force_guage.write("N\r\n")  # Set force gauge units to Newtons
                    print(f'Setting gauge units from {units} to "N" (newtons)')
                    continue
                else:
                    return float(force_val)
            except ValueError as e:
                print(e)
                print(f'bad data: "{line}"')
                continue
        raise TimeoutError(f"unable to read from gauge within {timeout} seconds")
