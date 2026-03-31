"""Mitutoyo ABSOLUTE Digimatic Indicator ID-S."""
import time
import numpy
import serial  # type: ignore[import]
from typing import Optional
from serial.tools.list_ports import comports  # type: ignore[import]


class Mitutoyo_Digimatic_Indicator:
    """Driver class to use dial indicator."""

    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600) -> None:
        """Initialize class."""
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        self.raise_exceptions = True
        self.reading_raw = ""
        self.GCODE = {
            "READ": "r",
        }
        self.gauge: serial.Serial | None = None
        self.packet: str = ""

    def connect(self) -> None:
        """Connect communication ports."""
        try:
            self.gauge = serial.Serial(
                port=self.PORT,
                baudrate=self.BAUDRATE,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=self.TIMEOUT,
            )
        except serial.SerialException:
            error = "Unable to access Serial port"
            raise serial.SerialException(error)

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self.gauge is not None:
            self.gauge.close()

    def _send_packet(self, packet: str) -> None:
        if self.gauge is not None:
            self.gauge.flush()
            self.gauge.reset_input_buffer()
            self.gauge.write(packet.encode())

    def _get_packet(self) -> str:
        packet = ""
        if self.gauge is not None:
            self.gauge.reset_output_buffer()
            packet = self.gauge.readline().decode("utf-8")
        return packet

    def read(self, timeout: Optional[float] = None) -> float:
        """Reads dial indicator."""
        self.packet = self.GCODE["READ"]
        self._send_packet(self.packet)
        time.sleep(0.001)
        then = time.monotonic()
        reading = True
        value = 0.0  # Initialize value to avoid unbound error
        while reading:
            if timeout and (time.monotonic() - then) > timeout:
                raise RuntimeError("Timeout reading")
            data = self._get_packet()
            time.sleep(0.01)
            if data != "":
                try:
                    value = float(data)
                    reading = False
                except ValueError:
                    continue
        return value

    def read_stable(self, timeout: float = 5) -> float:
        """Reads dial indicator with stable reading."""
        then = time.monotonic()
        values = [
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
        ]
        while (time.monotonic() - then) < timeout:
            if numpy.allclose(values, list(reversed(values))):
                return values[-1]
            values = values[1:] + [self.read(timeout)]
        raise RuntimeError("Couldn't settle")


def find_dial() -> Optional[Mitutoyo_Digimatic_Indicator]:
    """Search system for dial indicator."""
    ports = comports()
    for _port in ports:
        try:
            port = _port.device  # type: ignore[attr-defined]
            dial = Mitutoyo_Digimatic_Indicator(port)
            dial.connect()
            dial.read(1)
            return dial
        except Exception:
            pass
    return None


if __name__ == "__main__":
    print("Mitutoyo ABSOLUTE Digimatic Indicator")
    gauge = Mitutoyo_Digimatic_Indicator(port="/dev/ttyUSB0")
    gauge.connect()
    start_time = time.monotonic()
    while True:
        elapsed_time = round(time.monotonic() - start_time, 3)
        distance = gauge.read()
        print("Time: {} Distance: {}".format(elapsed_time, distance))
