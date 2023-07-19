"""Pressure Fixture Driver."""
from abc import ABC, abstractmethod
import random
from serial import Serial  # type: ignore[import]
from time import sleep
from typing import List, Tuple
from typing_extensions import Final, Literal

from opentrons.types import Point

FIXTURE_REBOOT_TIME = 2
FIXTURE_NUM_CHANNELS: Final[int] = 8
FIXTURE_BAUD_RATE: Final[int] = 115200

FIXTURE_CMD_TERMINATOR = "\r\n"
FIXTURE_CMD_GET_VERSION = "VERSION"
FIXTURE_CMD_GET_ALL_PRESSURE = "GETPRESSURE:15"

LOCATION_A1_LEFT = Point(x=14.4, y=74.5, z=71.2)
LOCATION_A1_RIGHT = LOCATION_A1_LEFT._replace(x=128 - 14.4)


class PressureFixtureBase(ABC):
    """Base Class if Mark10 Force Gauge Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """OT3 Pressure Fixture VID:PID."""
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
    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        ...

    @abstractmethod
    def read_all_pressure_channel(self) -> List[float]:
        """Read all pressure channels on fixture in Pascals."""
        ...

    def position_in_slot(self, side: Literal["left", "right"] = "left") -> Point:
        """Position in slot."""
        if side == "left":
            return LOCATION_A1_LEFT
        else:
            return LOCATION_A1_RIGHT

    @property
    def depth(self) -> float:
        """Depth."""
        return 14.0

    @property
    def tip_volume(self) -> int:
        """Tip Volume."""
        return 50

    @property
    def aspirate_volume(self) -> float:
        """Aspirate Volume."""
        return 20.0


class SimPressureFixture(PressureFixtureBase):
    """Simulating OT3 Pressure Fixture Driver."""

    def __init__(self, slot_side: str = "left") -> None:
        """Simulation of Pressure Fixture."""
        self._slot_side = slot_side

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

    def __init__(self, connection: Serial, slot_side: str) -> None:
        """Constructor."""
        self._port = connection
        assert slot_side in ["left", "right"], f"Unexpected slot side: {slot_side}"
        self._slot_side = slot_side

    @classmethod
    def create(cls, port: str, slot_side: str = "left") -> "PressureFixture":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = FIXTURE_BAUD_RATE
        conn.timeout = 1
        return PressureFixture(connection=conn, slot_side=slot_side)

    def connect(self) -> None:
        """Connect."""
        self._port.open()
        self._port.flushInput()
        # NOTE: device might take a few seconds to boot up
        sleep(FIXTURE_REBOOT_TIME)
        assert self.firmware_version(), "unable to communicate with pressure fixture"

    def disconnect(self) -> None:
        """Disconnect."""
        self._port.close()

    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        cmd_str = f"{FIXTURE_CMD_GET_VERSION}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        return self._port.readline().decode("utf-8").strip()

    def read_all_pressure_channel(self) -> List[float]:
        """Reads from all the channels from the fixture."""
        cmd_str = f"{FIXTURE_CMD_GET_ALL_PRESSURE}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        response = self._port.readline().decode("utf-8")
        res_list = response.split(",")[:-1]  # ignore the last comma
        data_str = [d.split("=")[-1].strip() for d in res_list]  # remove PRESSURE=
        for i in range(len(data_str)):  # replace all -0.00 with 0.00
            if data_str[i] == "-0.00":
                data_str[i] = "0.00"
        data = [float(d) for d in data_str]  # convert to float
        if self._slot_side == "left":
            data.reverse()  # reverse order, so pipette channel 1 is at index 0
        return data


if __name__ == "__main__":
    port_name = input("type the port of the device (eg: COM1): ")
    fixture = PressureFixture.create(port=port_name, slot_side="left")
    fixture.connect()
    print(f"Device firmware version: {fixture.firmware_version()}")
    while True:
        readings = fixture.read_all_pressure_channel()
        print(readings)
        sleep(0.1)
