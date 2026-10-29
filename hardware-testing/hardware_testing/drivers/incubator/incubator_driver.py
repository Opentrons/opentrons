from serial import Serial # type: ignore[import]
from typing import Optional
from serial.tools.list_ports import comports # type: ignore[import]
import enum
import time

Gcodes = {
    "move": "G0",
    "get_inductive_sensor_state" : "M113",
    "home": "G28",
}

class Axis(enum.Enum):
    R = "R"
    Z = "Z"
    P = "P"

def find_port_by_description(description: str) -> Optional[str]:
    for port in comports():
        if description in port.description:
            return port.device
    return None

class IncubatorModule:
    """ Incubator(Axis Controller Board)"""

    def __init__(self, connection: Serial) -> None:
        """Init"""
        self.connection = connection

    @classmethod
    def create(cls, port: str, baudrate: int):
        conn = Serial(port=port, baudrate=baudrate, timeout=1.0)
        return IncubatorModule(connection=conn)

    def connect(self):
        """Connect to Incubator"""
        try:
            if self.connection.is_open:
                print(f"Connection Open")
        except Exception as e:
            raise e
    
    def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self.connection.is_open:
            self.connection.reset_output_buffer()
            self.connection.close()

    def get_sensor_state(self):
        self.connection.reset_output_buffer()
        self._write(Gcodes["get_inductive_sensor_state"])
        sensor_state = self._readline()
        return sensor_state

    def home(self, axis, direction: bool = True):
        self.connection.reset_output_buffer()
        self._write(f"{Gcodes['home']} {axis.value}{direction}")
        data = self._readline()

    def move_to(self, axis, distance, velocity, acceleration):
        self.connection.reset_output_buffer()
        self._write(f"{Gcodes['move']} {axis.value}{distance} ")
        data = self._readline()

    def enable_motor(self, axis):
        self.connection.reset_output_buffer()
        self._write(f"{Gcodes['enable_motor']} {axis.value}")
        data = self._readline()

    def _write(self, message):
        self.connection.reset_output_buffer()
        self.connection.write(f"{message}\r\n".encode("utf-8"))

    def _readline(self) -> str:
        self.connection.reset_output_buffer()
        reading = True
        while reading:
            data = self.connection.readline().decode("utf-8").strip()
            if data != "":
                return data
            else:
                continue

if __name__ == "__main__":
    print("Promixity Sensor Test")
    com_port = find_port_by_description("STLINK-V3 - ST-Link VCP Ctrl")
    incubator = IncubatorModule.create(port=com_port, baudrate=115200)
    incubator.connect()
    sensor_state = incubator.get_sensor_state()
    print(f"Sensor State: {sensor_state}")

    for cycles in range(1, 100):
        incubator.home(Axis.R, 0)
        time.sleep(0.5)
        incubator.move_to(Axis.R, 50, 10, 10)