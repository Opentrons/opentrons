"""Flow rate sensor."""
from typing import Optional, Protocol
from abc import abstractmethod
import serial  # type: ignore[import]
import logging

# import datetime
import asyncio
import time
import csv
import serial.tools.list_ports  # type: ignore[import]

BAUDRATE = 115200
TIMEOUT = 1
ACK = "\n"
ERROR_KEYWORD = ""
DEFAULT_COMMAND_RETRIES = 2
GCODE_ROUNDING_PRECISION = 2


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    filename="/data/testing_data/flowrate_sensor.log",
    # filename='flowrate_sensor.log',
    filemode="a",
)


class AbstractMassFlowSensor(Protocol):
    """Protocol for mass flow sensor driver."""

    async def connect(self) -> None:
        """Connect to sensor."""
        ...

    async def disconnect(self) -> None:
        """Disconnect from sensor."""
        ...

    @abstractmethod
    async def is_simulator(self) -> bool:
        """Is this a simulation?"""
        ...

    async def get_flow_rate(self, timeout: float = 1.0) -> float:
        """Read flow rate in sLm."""
        ...

    async def set_csv_filename(self, new_path: str) -> None:
        """Name the csv file."""
        ...

    async def read_continuous_data(self, run_time: float) -> None:
        """Record flow rate in sLm."""
        ...

    async def stop(self) -> None:
        """Stop recording process."""
        ...


class MassFlowSensor(AbstractMassFlowSensor):
    """Driver class to use Flow rate driver."""

    @classmethod
    async def create(
        cls, port: str, csv_path: str, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "MassFlowSensor":
        """Create a Vacuum Module driver."""
        sensor = serial.Serial(port=port, baudrate=BAUDRATE, timeout=TIMEOUT)
        return cls(sensor=sensor, csv_path=csv_path)

    def __init__(self, sensor: serial.Serial, csv_path: str = "flow_rate.csv") -> None:
        """Initialize class."""
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.st = time.perf_counter()
        self._sensor = sensor  # Expect a Serial object here

    async def is_simulator(self) -> bool:
        """Is simulator."""
        return False

    async def connect(self) -> None:
        """Connect communication ports."""
        try:
            self._sensor.open()  # Now _sensor is a Serial object, so this works
            logging.info(
                "Connected to serial port %s at baudrate %d",
                self._sensor.port,
                BAUDRATE,
            )
        except serial.SerialException as e:
            logging.error("Unable to access Serial port: %s", e)
            raise RuntimeError(
                f"Failed to connect to serial port {self._sensor.port}: {e}"
            )

    async def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self._sensor is not None:
            self._sensor.close()
            logging.info("Disconnected from serial port %s", self._sensor)

    async def _readline(self) -> str:
        """Non-blocking read operation."""
        try:
            # Offload readline to another thread to avoid blocking the event loop
            data = await asyncio.to_thread(self._sensor.readline)
        except Exception as e:
            raise RuntimeError("Unable to read from sensor") from e
        # Let UnicodeDecodeError propagate so _get_packet() can catch and skip bad packets
        return data.decode("utf-8")

    async def _get_packet(self) -> str:
        packet = ""
        if self._sensor is not None:
            try:
                packet = await self._readline()
            except UnicodeDecodeError as e:
                logging.warning("Failed to decode packet: %s", e)
        return packet

    async def get_flow_rate(self, timeout: float = 5.0) -> float:
        """Reads dial indicator with a timeout."""
        start_time = time.monotonic()
        while time.monotonic() - start_time < timeout:
            data = await self._get_packet()
            fields = data.strip().split(",")
            logging.info(f"{fields}")
            if len(fields) >= 2:
                try:
                    return float(fields[1])
                except ValueError:
                    logging.warning("Invalid data received: %s", data)
                    continue
            time.sleep(0.001)
        logging.error("Failed to read valid data within the timeout.")
        raise ValueError("Failed to read valid data within the timeout.")

    async def _write_to_csv(self, timestamp: float, data: float) -> None:
        """Append a data line to the CSV file."""
        write_header = not self._csv_initialized
        try:
            with open(self.csv_path, "a", newline="") as f:
                writer = csv.writer(f)
                if write_header:
                    writer.writerow(
                        [
                            "Time(s)",
                            "Flow_rate(sLM)",
                        ]
                    )
                    self._csv_initialized = True
                writer.writerow(
                    [
                        f"{timestamp:.2f}",
                        f"{data}",
                    ]
                )
        except IOError as e:
            logging.error("Failed to write to CSV file %s: %s", self.csv_path, e)
            raise

    async def set_csv_filename(self, new_path: str) -> None:
        """Set a new CSV file path for subsequent continuous logging."""
        if new_path == self.csv_path:
            return
        self.csv_path = new_path
        self._csv_initialized = False
        print(f"file_name: {self.csv_path}")
        logging.info("CSV file path updated to %s", self.csv_path)

    async def read_continuous_data(self, run_time: float) -> None:
        """Read and print continuous data from the vacuum pump."""
        start_time = time.perf_counter()
        try:
            while time.perf_counter() - start_time < run_time:
                flow_rate = await self.get_flow_rate()
                ts = round(
                    time.perf_counter() - start_time, 2
                )  # Round to 2 decimal places
                await self._write_to_csv(ts, flow_rate)
                print(f"time(s): {ts:.2f}, flow_rate: {flow_rate}")
                logging.info("time(s): %.2f, flow_rate: %.2f", ts, flow_rate)
        except ValueError as e:
            logging.error("Error reading continuous data: %s", e)
        except Exception as e:
            logging.exception("Unexpected error: %s", e)
            raise

    async def stop(self) -> None:
        """Signal to stop continuous data reading."""
        self._stop_requested = True


async def find_port_by_id(vendorId: int, productId: int) -> str:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        print(f"port_vid: {port.vid}, port_pid: {port.pid}")
        if port.vid == vendorId and port.pid == productId:
            print(f"port: {port.device}")
            return port.device
    return ""
