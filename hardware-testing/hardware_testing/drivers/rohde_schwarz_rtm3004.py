"""Rohde & Schwarz RTM3004 Oscilloscope."""
import time
import numpy
import serial  # type: ignore[import]

class Rohde_Schwarz_RTM3004:
    """Driver class to use RTM3004 oscilloscope."""

    def __init__(self, port: str = "/dev/ttyACM0", baudrate: int = 9600) -> None:
        """Initialize class."""
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.ACK = "\r\n"
        self.GCODE = {
            "GET_INFO":"*IDN?",
            "GET_DATA":"CHAN{}:DATA?",
            "GET_MEASUREMENT":"MEAS{}:RES?",
        }
        self.connection = serial.Serial()
        self.packet = ""

    def connect(self) -> None:
        """Connect Serial port."""
        try:
            self.connection = serial.Serial(
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

    def _send_packet(self, packet: str) -> None:
        self.connection.flush()
        self.connection.flushInput()
        self.connection.write(packet.encode("utf-8"))

    def _get_packet(self) -> str:
        self.connection.flushOutput()
        packet = self.connection.readline().decode("utf-8").strip(self.ACK)
        return packet

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        self.connection.close()

    def get_info(self):
        """Get instrument identification."""
        ## Rohde&Schwarz,<device type>,<serial number>,<firmware version> ##
        self.packet = self.GCODE["GET_INFO"] + self.ACK
        self._send_packet(self.packet)
        reading = True
        while reading:
            info = self._get_packet()
            if info != "":
                reading = False
        return info

    def get_serial_number(self):
        """Get instrument serial number."""
        serial_number = self.get_info().split(',')[2]
        return serial_number

    def get_firmware_version(self) -> float:
        """Get instrument firmware version."""
        firmware = self.get_info().split(',')[3]
        return float(firmware)

    def get_data(self, channel: int):
        """Get instrument data from specific channel."""
        self.packet = self.GCODE["GET_DATA"].format(channel) + self.ACK
        self._send_packet(self.packet)
        reading = True
        while reading:
            data = self._get_packet()
            if data != "":
                reading = False
        return data

    def get_measurement(self, place: int) -> float:
        """Get instrument measurement from specific place."""
        self.packet = self.GCODE["GET_MEASUREMENT"].format(place) + self.ACK
        self._send_packet(self.packet)
        reading = True
        while reading:
            measurement = self._get_packet()
            if measurement != "":
                reading = False
        return float(measurement)

if __name__ == "__main__":
    print("Rohde & Schwarz RTM3004 Oscilloscope")
    oscilloscope = Rohde_Schwarz_RTM3004(port="/dev/ttyACM0")
    oscilloscope.connect()
    print(f"\nInfo: {oscilloscope.get_info()}\n")
    start_time = time.time()
    while True:
        place = 1
        elapsed_time = round(time.time() - start_time, 3)
        measurement = oscilloscope.get_measurement(place)
        print(f"Time: {elapsed_time} Measurement #{place}: {measurement}")
        time.sleep(1.0)
