"""Limit sensor module."""
import logging
from abc import ABC, abstractmethod
from typing import Optional

import serial  # type: ignore[import]
from serial.tools.list_ports import comports  # type: ignore[import]

log = logging.getLogger(__name__)


class LimitSensorBase(ABC):
    """Base class if limit sensor driver."""

    @abstractmethod
    def read(self) -> bytes:
        """Read data from sensor."""
        ...

    def is_open(self) -> bool:
        """Return true if door is open."""
        return b"OCOK" in self.read()

    def is_closed(self) -> bool:
        """Return true if door is closed."""
        return b"CCOK" in self.read()


class LimitSensor(LimitSensorBase):
    """Limit sensor driver."""

    def __init__(self, connection: serial.Serial) -> None:
        """Constructor."""
        self._connection = connection

    def read(self) -> bytes:
        """Read data from sensor."""
        self._connection.flush()
        self._connection.flushInput()
        self._connection.flushOutput()
        res = self._connection.readline()
        log.debug(f"response: {res}")
        return res

    @classmethod
    def create(
        cls, port: Optional[str], baud_rate: int = 115200, timeout: float = 0.1
    ) -> "LimitSensor":
        """Connect and create a limit sensor.

        :param port: Port. If None, the port will be searched for.
        :param baud_rate: Baud rate.
        :param timeout: Timeout in seconds.
        :return: Instance
        """
        return LimitSensor(
            serial.Serial(
                port=port if port else LimitSensor.scan_for_port("sensor"),
                baudrate=baud_rate,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=timeout,
            )
        )

    @staticmethod
    def scan_for_port(name: str) -> Optional[str]:
        """This function scans for these individual ports by VID:PID names."""
        # There may be something wrong with particle counter and robot port
        instruments = {"sensor": "USB VID:PID=1A86:7523"}
        port = None
        ports = comports()
        if name == "" or name is None:
            raise Exception("No instrument was named!")
        port_list = []
        for com_port, desc, hwid in sorted(ports):
            log.debug(f"{com_port}: {desc} [{hwid}]")
            port_list.append((com_port, desc, hwid))
        for vid in range(len(port_list)):
            if instruments[name] in port_list[vid][2]:
                port = port_list[vid][0]
        return port


class SimLimitSensor(LimitSensorBase):
    """Simulated limit sensor."""

    def read(self) -> bytes:
        """Read data from sensor."""
        # Return both values so is_open and is_closed are true.
        return b"CCOK OCOK"
