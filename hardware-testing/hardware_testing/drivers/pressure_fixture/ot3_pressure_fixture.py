import time, random, re
from typing import Any, Dict, Union, List, Optional, Tuple
from serial import Serial
import time
from abc import ABC, abstractmethod

verify_data = ['PRESSURE1',
                'PRESSURE2',
                'PRESSURE3',
                'PRESSURE4',
                'PRESSURE5',
                'PRESSURE6',
                'PRESSURE7',
                'PRESSURE8']

class Ot3PressureFixtureBase(ABC):
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
    def read_all_pressure_channel(self) -> float:
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

    def read_all_pressure_channel(self) -> float:
        """Read Pressure for all channels."""
        total_fixture_channels = 8
        pressure = [random.uniform(2.5, 2) for ch in range(total_fixture_channels)]
        return pressure

class Ot3PressureFixture(Ot3PressureFixtureBase):
    """OT3 Pressure Fixture Driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._fixture = connection
        self._number_of_channels = 8
        self._units = 'Pascals'

    @classmethod
    def create(cls, port: str, baudrate: int = 115200, timeout: float = 1) -> "Ot3PressureFixture":
        """Create a OT3 Pressure Fixture driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return Ot3PressureFixture(connection=conn)

    def connect(self) -> None:
        """Connect."""
        self._fixture.open()

    def disconnect(self) -> None:
        """Disconnect."""
        self._fixture.close()

    def _parse_pressure_data(self, raw_data)-> List:
        """Strip words out of the data. Returns only the values in a list"""
        parsed_data = []
        raw_data = raw_data.rstrip('\r\n')
        for i in raw_data.split(','):
            for j in str(i).split('='):
                parsed_data.append(j)
        for char in verify_data:
            if char in parsed_data:
                parsed_data.remove(char)
        if len(parsed_data) == 9:
            return parsed_data[:-1]
        return parsed_data

    def isValInLst(self, actual_data, compared_strings):
        """
            This function checks to see if it has all the necessary data.
            Returns a count number to check how many pressure values are there.
        """
        pressure_count = 0
        for string in compared_strings:
            if string in actual_data:
                pressure_count += 1
        return pressure_count

    def get_channel_pressure(self, channel):
        """
            Reads from individual channels
            Output: Pressure1: 1
        """
        self._fixture.flushInput()
        read = True
        self._fixture.write('GETPRESSURE:{}\r\n'.format(channel).encode('utf-8'))
        while read:
            data = self._fixture.readline().decode('utf-8')
            if 'PRESSURE{}='.format(channel) in data:
                data = self._parse_pressure_data(data)
                return float(data[0])
            else:
                self._fixture.write('GETPRESSURE:{}\r\n'.format(channel).encode('utf-8'))

    def read_all_pressure_channel(self):
        """
            Reads from all the channels from the fixture
            Output: []
        """
        read = True
        bytes = 8
        self._fixture.flushInput()
        self._fixture.write('GETPRESSURE:15\r\n'.encode('utf-8'))
        while read:
            data = ''
            for line in self._fixture.readlines(bytes):
                data = data + line.decode('utf-8')
            length_of_data = self.isValInLst(data, verify_data)
            if length_of_data == bytes:
                res = self._parse_pressure_data(data)
                if len(res) == 8:
                    return res
            else:
                self._fixture.write('GETPRESSURE:15\r\n'.encode('utf-8'))
