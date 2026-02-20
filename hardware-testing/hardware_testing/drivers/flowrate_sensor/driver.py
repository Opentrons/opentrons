"""Flow rate sensor."""
from typing import Optional, Protocol
from abc import abstractmethod
import serial # type: ignore[import]
import logging
import datetime
import asyncio
import time
import csv

BAUDRATE = 115200
TIMEOUT = 1

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/data/testing_data/flowrate_sensor.log',
    filemode='a'
)

class AbstractMassFlowSensor(Protocol):
    """Protocol for mass flow sensor driver."""
    async def connect(self) -> None:
        """Connect to sensor."""
        ...

    async def disconnect(self) -> None:
        """Disconnect from sensor"""
        ...

    @abstractmethod
    async def is_simulator(self) -> bool:
        """Is this a simulation"""
        ...
    
    async def get_flow_rate(self, timeout: float = 1.0) -> float:
        """Read flow rate in sLm"""
        ...

    def set_csv_filename(self, new_path: str) -> None:
        """Name the csv file"""
        ...

    async def read_continuous_data(self, run_time):
        """Record flow rate in sLm"""
        ...
    
    async def stop(self):
        """Stop Recording Process"""
        ...

class MassFlowSensor(AbstractMassFlowSensor):
    """Driver class to use Flow rate driver."""

    def __init__(self, sensor: serial.Serial, csv_path: str = "flow_rate.csv") -> None:
        """Initialize class."""
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.st = time.perf_counter()
        self._sensor = sensor  # Expect a Serial object here

    @classmethod
    async def create(cls, port: str, csv_path: str, loop: Optional[asyncio.AbstractEventLoop] = None) -> "MassFlowSensor":
        conn = serial.Serial(port=port, baudrate=BAUDRATE, timeout=TIMEOUT)
        return cls(sensor=conn, csv_path=csv_path)
    
    async def is_simulator(self) -> bool:
        """Is simulator."""
        return False

    async def connect(self) -> None:
        """Connect communication ports."""
        try:
            self._sensor.open()  # Now _sensor is a Serial object, so this works
            logging.info("Connected to serial port %s at baudrate %d", self._sensor.port, BAUDRATE)
        except serial.SerialException as e:
            logging.error("Unable to access Serial port: %s", e)
            raise RuntimeError(f"Failed to connect to serial port {self._sensor.port}: {e}")

    async def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self._sensor is not None:
            self._sensor.close()
            logging.info("Disconnected from serial port %s", self._sensor)

    async def _readline(self) -> str:
        """Non-blocking read operation."""
        try:
            # Offload readline to another thread to avoid blocking the event loop
            return (await asyncio.to_thread(self._sensor.readline)).decode("utf-8")
        except Exception as e:
            # logger.error(f"Error reading from force gauge: {e} ")
            raise RuntimeError("Unable to read from sensor")
        
    async def _get_packet(self) -> str:
        packet = ""
        if self._sensor is not None:
            self._sensor.reset_output_buffer()
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
            data = data.strip().split(',')
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
        print(f'file_name: {self.csv_path}')
        logging.info("CSV file path updated to %s", self.csv_path)

    async def read_continuous_data(self, run_time):
        """Read and print continuous data from the vacuum pump."""
        start_time = time.perf_counter()
        try:
            while time.perf_counter() - start_time < run_time:
                flow_rate = await self.get_flow_rate()
                ts = round(time.perf_counter() - start_time, 2)  # Round to 2 decimal places
                self._write_to_csv(ts, flow_rate)
                print(f'time(s): {ts:.2f}, flow_rate: {flow_rate}')
                logging.info("time(s): %.2f, flow_rate: %.2f", ts, flow_rate)
        except ValueError as e:
            logging.error("Error reading continuous data: %s", e)
        except Exception as e:
            logging.exception("Unexpected error: %s", e)
            raise

    async def stop(self):
        """Signal to stop continuous data reading."""
        self._stop_requested = True

# async def main(file_name, loop):
#     print(f'file_name: {file_name}')
#     sensor = await MassFlowSensor.create(port="/dev/ttyACM1", csv_path=file_name, loop=loop)
#     try:
#         sensor.set_csv_filename(file_name)
#         asyncio.create_task(sensor.read_continuous_data())
#         await asyncio.sleep(5)
#         await sensor.stop()
#     except Exception as e:
#         logging.critical("Critical failure: %s", e)


# if __name__ == "__main__":
#     logging.info("Flow rate sensor initialized.")
#     current_datetime = datetime.datetime.utcnow().strftime("%y-%m-%d %H:%M")
#     file_name = '/data/testing_data/example-test/FlowrateData_{current_datetime}.csv'
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#     asyncio.run(main(file_name, loop))
