"""Flow rate sensor."""
import time
import numpy
import serial  # type: ignore[import]
import dataclasses
import csv
from datetime import datetime
import logging


BAUDRATE = 115200
TIMEOUT = 1

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/data/testing_data/flowrate_sensor.log',
    filemode='a'
)

class MassFlowSensor:
    """Driver class to use Flow rate driver."""

    def __init__(self, port: str = "/dev/ttyACM1", csv_path: str = "flow_rate.csv") -> None:
        """Initialize class."""
        self.PORT = port
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.st = time.perf_counter()
        self.gauge = None

        # Validate port and baudrate
        if not isinstance(self.PORT, str) or not self.PORT:
            raise ValueError("Invalid port specified.")
        if not isinstance(BAUDRATE, int) or BAUDRATE <= 0:
            raise ValueError("Invalid baudrate specified.")

    def connect(self) -> None:
        """Connect communication ports."""
        try:
            self.gauge = serial.Serial(
                port=self.PORT,
                baudrate=BAUDRATE,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=TIMEOUT,
            )
            logging.info("Connected to serial port %s at baudrate %d", self.PORT, BAUDRATE)
        except serial.SerialException as e:
            logging.error("Unable to access Serial port: %s", e)
            raise RuntimeError(f"Failed to connect to serial port {self.PORT}: {e}")

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self.gauge is not None:
            self.gauge.close()
            logging.info("Disconnected from serial port %s", self.PORT)

    def __enter__(self):
        """Enter the runtime context related to this object."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        """Exit the runtime context and close the connection."""
        self.disconnect()

    def _send_packet(self, packet: str) -> None:
        if self.gauge is not None:
            self.gauge.flush()
            self.gauge.reset_input_buffer()
            self.gauge.write(packet.encode())

    def _get_packet(self) -> str:
        packet = ""
        if self.gauge is not None:
            self.gauge.reset_output_buffer()
            try:
                packet = self.gauge.readline().decode("utf-8")
            except UnicodeDecodeError as e:
                logging.warning("Failed to decode packet: %s", e)
        return packet

    def get_flow_rate(self, timeout: float = 5.0) -> float:
        """Reads dial indicator with a timeout."""
        start_time = time.monotonic()
        while time.monotonic() - start_time < timeout:
            data = self._get_packet().strip().split(',')
            if len(data) >= 2:
                try:
                    return float(data[0])
                except ValueError:
                    logging.warning("Invalid data received: %s", data)
                    continue
            time.sleep(0.001)
        logging.error("Failed to read valid data within the timeout.")
        raise ValueError("Failed to read valid data within the timeout.")

    def _write_to_csv(self, timestamp: float, data: float) -> None:
        """Append a data line to the CSV file."""
        write_header = not self._csv_initialized
        try:
            with open(self.csv_path, "a", newline="") as f:
                writer = csv.writer(f)
                if write_header:
                    writer.writerow([
                        "Time(s)",
                        "Flow_rate(sLM)",
                    ])
                    self._csv_initialized = True
                writer.writerow([
                    f"{timestamp:.2f}",
                    f"{data}",
                ])
        except IOError as e:
            logging.error("Failed to write to CSV file %s: %s", self.csv_path, e)
            raise

    def set_csv_filename(self, new_path: str) -> None:
        """Set a new CSV file path for subsequent continuous logging."""
        if new_path == self.csv_path:
            return
        self.csv_path = new_path
        self._csv_initialized = False
        logging.info("CSV file path updated to %s", self.csv_path)

    def read_continuous_data(self):
        """Read and print continuous data from the vacuum pump."""
        try:
            while not self._stop_requested:
                flow_rate = self.get_flow_rate()
                ts = time.perf_counter() - self.st
                self._write_to_csv(ts, flow_rate)
                logging.info("time(s): %.2f, flow_rate: %.2f", ts, flow_rate)
        except ValueError as e:
            logging.error("Error reading continuous data: %s", e)
        except Exception as e:
            logging.exception("Unexpected error: %s", e)
            raise

    def stop(self):
        """Signal to stop continuous data reading."""
        self._stop_requested = True


if __name__ == "__main__":
    logging.info("Flow rate sensor initialized.")
    date_str = datetime.utcnow().strftime("%y-%m-%d")
    file_name = str(f'/data/testing_data/example-test/FlowrateData_{date_str}.csv')
    try:
        with MassFlowSensor(port="/dev/ttyACM1", csv_path=file_name) as meter:
            meter.set_csv_filename(file_name)
            meter.read_continuous_data()
    except Exception as e:
        logging.critical("Critical failure: %s", e)