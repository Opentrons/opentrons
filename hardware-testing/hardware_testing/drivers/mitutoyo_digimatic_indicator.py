"""Mitutoyo ABSOLUTE Digimatic Indicator ID-S."""
import time
import numpy
import serial  # type: ignore[import]


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
        self.gauge = serial.Serial()
        self.packet = ""

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
        self.gauge.close()

    def _send_packet(self, packet: str) -> None:
        self.gauge.flush()
        self.gauge.flushInput()
        self.gauge.write(packet.encode("utf-8"))

    def _get_packet(self) -> str:
        self.gauge.flushOutput()
        packet = self.gauge.readline().decode("utf-8")
        return packet

    def read(self) -> float:
        """Reads dial indicator."""
        self.packet = self.GCODE["READ"]
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


if __name__ == "__main__":
    print("Mitutoyo ABSOLUTE Digimatic Indicator")
    gauge = Mitutoyo_Digimatic_Indicator(port="/dev/ttyUSB0")
    gauge.connect()
    start_time = time.time()
    while True:
        elapsed_time = round(time.time() - start_time, 3)
        distance = gauge.read()
        print("Time: {} Distance: {}".format(elapsed_time, distance))
