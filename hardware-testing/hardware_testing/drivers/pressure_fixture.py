from abc import ABC, abstractmethod
import random
from serial import Serial  # type: ignore[import]
from time import sleep
from typing import List, Tuple
from typing_extensions import Final

FIXTURE_REBOOT_TIME = 2
FIXTURE_NUM_CHANNELS: Final[int] = 8
FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_VID_PID: Final[Tuple] = (
    0x0483,
    0xA1AD,
)

FIXTURE_CMD_TERMINATOR = "\r\n"
FIXTURE_CMD_GET_VERSION = "VERSION"
FIXTURE_CMD_GET_ALL_PRESSURE = "GETPRESSURE:15"


class PressureFixtureBase(ABC):
    """Base Class if Mark10 Force Gauge Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """OT3 Pressure Fixture VID:PID."""
        # Check what's the VID and PID for this device
        return FIXTURE_VID_PID

    @abstractmethod
    def connect(self) -> None:
        """Connect to the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        ...

    @abstractmethod
    def read_all_pressure_channel(self) -> List[float]:
        """Read all pressure channels on fixture in Pascals."""
        ...


class SimPressureFixture(PressureFixtureBase):
    """Simulating OT3 Pressure Fixture Driver."""

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def firmware_version(self) -> str:
        """Firmware version."""
        return "0.0.0"

    def read_all_pressure_channel(self) -> List[float]:
        """Read Pressure for all channels."""
        pressure = [random.uniform(2.5, 2) for _ in range(FIXTURE_NUM_CHANNELS)]
        return pressure


class PressureFixture(PressureFixtureBase):
    """OT3 Pressure Fixture Driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._port = connection

    @classmethod
    def create(
            cls, port: str, baudrate: int = FIXTURE_BAUD_RATE, timeout: float = 1
    ) -> "PressureFixture":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return PressureFixture(connection=conn)

    def connect(self) -> None:
        """Connect."""
        self._port.open()
        self._port.flushInput()
        # NOTE: device might take a few seconds to boot up
        sleep(FIXTURE_REBOOT_TIME)
        assert self.firmware_version(), f"No version read from device"

    def disconnect(self) -> None:
        """Disconnect."""
        self._port.close()

    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        cmd_str = f"{FIXTURE_CMD_GET_VERSION}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        return self._port.readline().decode("utf-8").strip()

    def read_all_pressure_channel(self) -> List[float]:
        """
        Reads from all the channels from the fixture
        Output: []
        """
        cmd_str = f"{FIXTURE_CMD_GET_ALL_PRESSURE}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        response = self._port.readline().decode("utf-8")
        res_list = response.split(",")[:-1]  # ignore the last comma
        data = [float(d.split("=")[-1]) for d in res_list]
        return data


if __name__ == "__main__":
    port_name = "COM10"
    fixture = PressureFixture.create(port=port_name)
    fixture.connect()
    print(f"Device firmware version: {fixture.firmware_version()}")
    readings = fixture.read_all_pressure_channel()
    print(readings)
    fixture.disconnect()
