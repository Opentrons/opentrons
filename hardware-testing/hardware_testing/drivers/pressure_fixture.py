import random
from typing import List, Tuple, Final
from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod

FIXTURE_NUM_CHANNELS: Final[int] = 8
FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_VID_PID: Final[Tuple] = (0x0483, 0xA1AD,)

verify_data = [
    "PRESSURE1",
    "PRESSURE2",
    "PRESSURE3",
    "PRESSURE4",
    "PRESSURE5",
    "PRESSURE6",
    "PRESSURE7",
    "PRESSURE8",
]


def _parse_pressure_data(raw_data) -> List:
    """Strip words out of the data. Returns only the values in a list"""
    parsed_data = []
    raw_data = raw_data.rstrip("\r\n")
    for i in raw_data.split(","):
        for j in str(i).split("="):
            parsed_data.append(j)
    for char in verify_data:
        if char in parsed_data:
            parsed_data.remove(char)
    if len(parsed_data) == 9:
        return parsed_data[:-1]
    return parsed_data


def _is_val_in_list(actual_data, compared_strings):
    """
    This function checks to see if it has all the necessary data.
    Returns a count number to check how many pressure values are there.
    """
    pressure_count = 0
    for string in compared_strings:
        if string in actual_data:
            pressure_count += 1
    return pressure_count


class Ot3PressureFixtureBase(ABC):
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
    def read_all_pressure_channel(self) -> List[float]:
        """Read all pressure channels on fixture in Pascals."""
        ...


class SimOt3PressureFixture(Ot3PressureFixtureBase):
    """Simulating OT3 Pressure Fixture Driver."""

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def read_all_pressure_channel(self) -> List[float]:
        """Read Pressure for all channels."""
        pressure = [random.uniform(2.5, 2) for _ in range(FIXTURE_NUM_CHANNELS)]
        return pressure


class Ot3PressureFixture(Ot3PressureFixtureBase):
    """OT3 Pressure Fixture Driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._port = connection

    def connect(self) -> None:
        """Connect."""
        self._port.open()

    def disconnect(self) -> None:
        """Disconnect."""
        self._port.close()

    def read_all_pressure_channel(self) -> List[float]:
        """
        Reads from all the channels from the fixture
        Output: []
        """
        bytes_len = 8
        self._port.flushInput()
        self._port.write("GETPRESSURE:0\r\n".encode("utf-8"))
        while True:
            data_bytes = self._port.readlines(bytes_len)
            data_str = "".join([l.decode("utf-8") for l in data_bytes])
            length_of_data = _is_val_in_list(data_str, verify_data)
            if length_of_data == bytes_len:
                res = _parse_pressure_data(data_str)
                break
            else:
                self._port.write("GETPRESSURE:0\r\n".encode("utf-8"))
        return res
