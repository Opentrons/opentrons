import serial
import time
import math
from typing import Optional
import serial.tools.list_ports

VID = 1155
PID = 14158

def find_port_by_id(vendorId: int, productId: int) -> Optional[str]:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    print(ports)
    for port in ports:
        print(f"port_vid: {port.vid}, port_pid: {port.pid}")
        if port.vid == vendorId and port.pid == productId:
            print(f"port: {port.device}")
            return port.device
    return ""

class HallEffectSensor:
    def __init__(self, port: str, baudrate: int = 115200, timeout: float = 1.0):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
    
    def connect(self):
        try:
            self.connection = serial.Serial(
                port=self.port, baudrate=self.baudrate, timeout=self.timeout
            )
            time.sleep(1)
        except serial.SerialException as e:
            print(f"Failed to connect to Hall Effect Sensor on {self.port}: {e}")
            self.connection = None

    def disconnect(self):
        if self.connection and self.connection.is_open:
            self.connection.close()
            self.connection = None

    def read_sensor(self) -> str:
        if self.connection is None:
            raise RuntimeError("Hall effect sensor is not connected")

        self.connection.reset_input_buffer()
        while True:
            raw = self.connection.readline()
            # print(f"raw: {raw}")
            if not raw:
                continue

            data = raw.decode("ascii", errors="ignore").strip()
            # print(f"data: {data}")
            if not data:
                continue

            values = [value.strip() for value in data.replace(";", ",").split(",")]
            if len(values) == 3 and all(value for value in values):
                # print("raw: ", values)
                # print("connection: ", self.connection.in_waiting)
                return ",".join(values)

    def get_n_samples(self, n: int) -> list[Optional[tuple[float, float, float]]]:
        samples = []
        for _ in range(n):
            data = self.read_sensor()
            parsed_data = self.parse_data(data)
            samples.append(parsed_data)
        average_sample = tuple(sum(values) / len(values) for values in zip(*samples))
        return average_sample

    def parse_data(
        self, data: Optional[str | tuple[float, float, float] | list[float]]
    ) -> Optional[tuple[float, float, float]]:
        if data is None:
            return None

        if isinstance(data, (tuple, list)):
            if len(data) != 3:
                return None
            try:
                return tuple(float(value) for value in data)
            except (TypeError, ValueError):
                return None

        if not isinstance(data, str):
            return None

        parts = [part.strip() for part in data.replace(";", ",").split(",")]
        if len(parts) != 3:
            return None
        try:
            return tuple(float(part) for part in parts)
        except ValueError:
            return None

    def convert_to_angle(
        self, magnetic_field: Optional[tuple[float, float, float]]
    ) -> Optional[float]:
        if magnetic_field is None or len(magnetic_field) != 3:
            return None
        bx, by, bz = magnetic_field
        angle_deg = math.degrees(math.atan2(by, bz))
        return angle_deg

if __name__ == "__main__":
    port = find_port_by_id(vendorId=VID, productId=PID)  # Example for STM32
    sensor = HallEffectSensor(port=port)  # Replace with the actual port
    sensor.connect()
    try:
        while True:
            data = sensor.get_n_samples(n=10)
            magnetic_field = sensor.parse_data(data)  # Use the most recent sample
            # print(magnetic_field)
            angle = sensor.convert_to_angle(magnetic_field)
            print(f"Magnetic Field: {magnetic_field}, Angle: {angle:.2f} degrees")
    except KeyboardInterrupt:
        print("Exiting...")