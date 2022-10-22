"""Mitutoyo ABSOLUTE Digimatic Indicator ID-S."""
import time
import numpy
from typing import Tuple

from random import uniform
from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod


class Mitutoyo_Digimatic_Indicator_Base(ABC):
    """Base Class if dial indicator Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """Dial indicator VID:PID."""
        # Check what's the VID and PID for this device
        return 0x0483, 0xA1AD

    @abstractmethod
    def connect(self) -> None:
        """Connect to the dial indicator."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the dial indicator."""
        ...

    @abstractmethod
    def read(self) -> float:
        """Single displacement reading."""
        ...

    @abstractmethod
    def read_stable(self) -> float:
        """Simulate stable displacement."""
        ...


class Sim_Mitutoyo_Digimatic_Indicator(Mitutoyo_Digimatic_Indicator_Base):
    """Simulating dial indicator Driver."""

    def connect(self) -> None:
        """Connect port."""
        return

    def disconnect(self) -> None:
        """Disconnect port."""
        return

    def read(self) -> float:
        """Simulate single displacement reading."""
        return uniform(0, 5)

    def read_stable(self) -> float:
        """Simulate stable displacement."""
        return uniform(0, 5)


class Mitutoyo_Digimatic_Indicator(Mitutoyo_Digimatic_Indicator_Base):
    """Driver class to use dial indicator."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self.dial_gauge = connection
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        self.raise_exceptions = True
        self.reading_raw = ""
        self.GCODE = {
            "READ": "r",
        }
        self.packet = ""

    @classmethod
    def create(
        cls, port: str, baudrate: int = 9600, timeout: float = 1
    ) -> "Mitutoyo_Digimatic_Indicator":
        """Create a dial Indicator driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return Mitutoyo_Digimatic_Indicator(connection=conn)

    def connect(self) -> None:
        """Connect communication ports."""
        try:
            self.dial_gauge.open()
        except Serial.SerialException:
            error = "Unable to access Serial port"
            raise Serial.SerialException(error)

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        self.dial_gauge.close()

    def _send_packet(self, packet: str) -> None:
        self.dial_gauge.flush()
        self.dial_gauge.flushInput()
        self.dial_gauge.write(packet.encode("utf-8"))

    def _get_packet(self) -> str:
        self.dial_gauge.flushOutput()
        packet = self.dial_gauge.readline().decode("utf-8")
        return packet

    def read(self) -> float:
        """Reads dial indicator."""
        self.dial_gauge = self.GCODE["READ"]
        self._send_packet(self.packet)
        time.sleep(0.001)
        reading = True
        while reading:
            data = self._get_packet()
            if data != "":
                reading = False
        return float(data)

    def read_stable(self, timeout: float = 5) -> float:
        """Reads dial indicator with stable reading."""
        then = time.time()
        values = [self.read(), self.read(), self.read(), self.read(), self.read()]
        while (time.time() - then) < timeout:
            if numpy.allclose(values, list(reversed(values))):
                return values[-1]
            values = values[1:] + [self.read()]
        raise RuntimeError("Couldn't settle")
