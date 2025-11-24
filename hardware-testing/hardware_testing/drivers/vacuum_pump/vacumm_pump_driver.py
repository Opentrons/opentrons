"""Vacuum Pump Driver

Enhancements:
- Selective logging with category filters (pressure, ack, io, state, error).
- Single-sample read via `read_pressure` for ad-hoc measurements.
- CSV writing guarded & structured.
"""

from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod
from typing import List, Optional, Set, Dict
import time
import asyncio
import csv
import re

COMMANDS = {'Pump_State': 'TurnOnPump', 
            'Set_Pressure': 'SetPressure',
            'Open_Vent': 'TurnOnVent',
            'Close_Vent': 'TurnOffVent'}

V_BAUDRATE = 115200
DEFAULT_V_TIMEOUT = 1
V_ACK = "\r\n"

class OpentronsVacuumBase(ABC):
    "Base Class for Opentrons Vacuum."
    
    @abstractmethod
    def connect(self) -> None:
        """Connect to Vacuum Pump."""
        ...
    
    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the Opentrons Vacuum Pump."""
        ...

    @abstractmethod
    def set_pressure(self, pressure: int = 1000) -> None:
        """Set Pressure."""
        ...

    @abstractmethod
    def read_continous_data(self, duration: int = 1) -> List:
        """Read continous data."""
        ...

    @abstractmethod
    async def read_pressure(self, timeout: float = 2.0) -> Optional[dict]:
        """Read a single pressure sample (raw + filtered PA/PB) within timeout.

        Returns a dict with keys: pa_raw, pa_filtered, pb_raw, pb_filtered or None if unavailable.
        """
        ...


class SimOpentronsVacuumBase(OpentronsVacuumBase):
    """Simulating Mark 10 Driver."""

    def __init__(self) -> None:
        """Simulating Vacuum Pump Driver."""
        self._pressure = 0.0
        super().__init__()

    def is_simulator(self) -> bool:
        """Is a simulator."""
        return True

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def set_pressure(self, pressure: int = 1000) -> None:
        """Set Pressure for the Vacuum system."""
        return

    def read_continuous_data(self, pressure: float) -> float:
        """Set simulation pressure and return the simulated filtered pressure."""
        self._pressure = pressure
        return self._pressure


class OpentronsVacuum():
    """Vacuum pump Driver"""
    def __init__(self, connection: Serial, csv_path: str = "pump_test.csv"):
        self.connection = connection
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.pressure_set = None
        self.st = time.perf_counter()
        # Logging controls
        self._logging_enabled: bool = True
        self._log_categories: Optional[Set[str]] = None  # None => all
        # Precompiled regex for pressure line detection (comma-separated floats)
        self._pressure_line_re = re.compile(r"^\s*[^,]*\d+(?:\.\d+)?\s*,")

    @classmethod
    async def create(cls, port: str, baudrate: int, loop: Optional[asyncio.AbstractEventLoop]) -> "OpentronsVacuum":
        """Create a Opentrons Vacuum driver."""
        conn = Serial(port=port, baudrate=baudrate, timeout=1.0)
        return OpentronsVacuum(connection = conn)
    
    async def connect(self)-> None:
        try:
            if self.connection.is_open:
                self._log('state', 'Connection open')
        except Exception as e:
            raise

    async def disconnect(self) -> None:
        """Disconnect."""
        try: 
            if self.connection.is_open:
                self.connection.close()
                print('Connection close')
        except Exception as e:
            raise RuntimeError(f"Unable to connect: {e}") from e

    async def _write(self, data: bytes) -> None:
        """Non-blocking write operation."""
        try:
            # Offload write to another thread to avoid blocking the event loop
            await asyncio.to_thread(self.connection.write, data)
        except Exception as e:
            raise(e)
        
    async def _readline(self) -> str:
        """Non-blocking read operation."""
        try:
            # Offload readline to another thread to avoid blocking the event loop
            return (await asyncio.to_thread(self.connection.readline)).decode("utf-8", errors="ignore")
        except PermissionError as e:
            # Windows ClearCommError / Access denied transient; attempt recovery
            self._log('error', f"PermissionError on readline: {e}; attempting recover")
            await self._recover_port()
            return ""  # treat as empty line, caller will loop
        except Exception as e:
            # Other serial exceptions bubble up but are logged
            self._log('error', f"_readline exception: {e}")
            raise(e)

    async def set_pressure(self, pressure: int) -> None:
        """Pressure(mbar), 1ATM is ~1000mbar"""
        # Relative pressure from ~ATM, EX set 900, would be 100mbar 1000-900mbar
        command = f"{COMMANDS['Set_Pressure']}:{pressure}{V_ACK}"
        await self._write(command.encode())
        self.pressure_set = pressure

    async def change_pump_state(self, state: int):
        """"Change the state of the Pump, either on or off"""
        command = f"{COMMANDS['Pump_State']}:{state}{V_ACK}"
        await self._write(command.encode())

    async def send_stop(self):
        """Send a stop command to the device."""
        self._stop_requested = True
        await self.change_pump_state(0)
        self._log('state', 'Stop Pump')

    async def open_vent(self):
        """"Change the state of the Pump, either on or off"""
        command = f"{COMMANDS['Open_Vent']}:{V_ACK}"
        await self._write(command.encode())

    async def close_vent(self):
        """"Change the state of the Pump, either on or off"""
        command = f"{COMMANDS['Close_Vent']}:{V_ACK}"
        await self._write(command.encode())

    async def _write_to_csv(self, timestamp: float, data: List[float]) -> None:
        """Append a data line to the CSV file (offloaded to a thread).

        Expects `data` to have at least 4 numeric elements: [PA_FILTERED, PA_RAW, PB_FILTERED, PB_RAW].
        Adds the current `pressure_set` as the last column (may be None).
        """
        if len(data) < 4:
            # Skip malformed/short lines quietly; caller should already filter, but be defensive
            return

        def _append() -> None:
            write_header = not self._csv_initialized
            with open(self.csv_path, "a", newline="") as f:
                writer = csv.writer(f)
                if write_header:
                    writer.writerow(["timestamp", "PA_RAW", "PA_FILTERED",  "PB_RAW", "PB_FILTERED",  "SET_PRESSURE"])
                    self._csv_initialized = True
                writer.writerow([
                    f"{timestamp:.2f}",
                    f"{data[0]:.2f}",
                    f"{data[1]:.2f}",
                    f"{data[2]:.2f}",
                    f"{data[3]:.2f}",
                    self.pressure_set if self.pressure_set is not None else 0,
                ])

        await asyncio.to_thread(_append)

    def set_csv_filename(self, new_path: str) -> None:
        """Set a new CSV file path for subsequent continuous logging.

        Resets header initialization so the next write creates a header.
        """
        # If unchanged, do nothing
        if new_path == self.csv_path:
            return
        self.csv_path = new_path
        self._csv_initialized = False

    def data_to_cells(self, tokens: List[str]) -> Optional[List[float]]:
        """Convert a tokenized CSV line into a list of up to 4 floats.

        - Drops the first non-numeric label if present (device often prefixes a label).
        - Filters empty tokens.
        - Returns None if fewer than 4 numeric values are present.
        """
        nums: List[float] = []
        # Try to parse all numeric fields; skip empty/non-numeric tokens
        for idx, t in enumerate(tokens):
            t = t.strip()
            if not t:
                continue
            try:
                nums.append(float(t))
            except ValueError:
                # Likely a leading label; ignore it
                continue
        if len(nums) < 4:
            return None
        # Keep the first 4 values in expected order
        return nums[:4]

    async def read_continuous_data(self):
        """Read and print continuous data from the vacuum pump for the specified timeout duration."""
        try:
            while True:
                line = await self._readline()
                if not line.strip():
                    # No data -> possible end of stream or timeout
                    if self._stop_requested:
                        self._log('state', "Device stopped sending data.")
                        break
                    await asyncio.sleep(0.1)
                    continue
                # print(line)
                tokens = line.strip().split(',')
                data = self.data_to_cells(tokens)
                if data is None:
                    # Not enough numeric data on this line; skip
                    self._log('io', f"Skipped non-data line: {line.strip()[:60]}")
                    continue
                # Timestamp
                ts = time.perf_counter() - self.st
                #Record to csv
                # TODO make this optional later
                await self._write_to_csv(ts, data)
                self._log('pressure', f"ts={ts:.2f} PA_RAW={data[0]:.2f} PA_FIL={data[1]:.2f} PB_RAW={data[2]:.2f} PB_FIL={data[3]:.2f}")
        except Exception as e:
            self._log('error', f"Continuous read error: {e}")
            # Attempt one recovery cycle then continue unless stop requested
            if isinstance(e, PermissionError):
                await self._recover_port()
                if not self._stop_requested:
                    return await self.read_continuous_data()  # restart loop
            raise(e)

    async def read_pressure(self, timeout: float = 2.0) -> Optional[dict]:
        """Read a single pressure sample from the stream within a timeout window.

        This does a best-effort attempt to read and parse one line of numeric data.
        Returns a dict: {"pa_raw": float, "pa_filtered": float, "pb_raw": float, "pb_filtered": float}
        or None if no valid line received before timeout.
        """
        end_time = time.perf_counter() + timeout
        while time.perf_counter() < end_time:
            try:
                line = await self._readline()
            except PermissionError:
                # Already handled in _readline, treat as empty and continue
                await asyncio.sleep(0.05)
                continue
            except Exception:
                await asyncio.sleep(0.05)
                continue
            if not line.strip():
                await asyncio.sleep(0.05)
                continue
            tokens = line.strip().split(',')
            parsed = self.data_to_cells(tokens)
            if parsed is None:
                continue
            # Based on current assumptions: parsed[0..3] correspond to PA_RAW, PA_FILTERED, PB_RAW, PB_FILTERED
            # If ordering differs, adjust mapping here.
            sample = {
                "pa_raw": parsed[0],
                "pa_filtered": parsed[1],
                "pb_raw": parsed[2],
                "pb_filtered": parsed[3],
            }
            self._log('pressure', f"single-sample pa_fil={sample['pa_filtered']:.2f} pb_fil={sample['pb_filtered']:.2f}")
            return sample
        return None

    # ---------------------- Logging Helpers ----------------------
    def enable_logging(self, categories: Optional[Set[str]] = None) -> None:
        """Enable logging. Pass a set of categories to filter; None => all categories.

        Categories used: pressure, ack, io, state, error
        """
        self._logging_enabled = True
        self._log_categories = categories

    def disable_logging(self) -> None:
        """Disable all logging output."""
        self._logging_enabled = False

    def _should_log(self, category: str) -> bool:
        if not self._logging_enabled:
            return False
        if self._log_categories is None:
            return True
        return category in self._log_categories

    def _log(self, category: str, message: str) -> None:
        if self._should_log(category):
            # Simple format; could route to ctx.comment or standard logger.
            print(f"[{category}] {message}")

    def classify_line(self, line: str) -> str:
        """Classify a raw line from the device into pressure/ack/io/other.

        - pressure: line parses into numeric tokens via data_to_cells
        - ack: contains 'ACK' or 'OK'
        - io: any other non-empty line
        - other: empty
        """
        lstrip = line.strip()
        if not lstrip:
            return 'other'
        if 'ACK' in lstrip.upper() or re.search(r"\bOK\b", lstrip, flags=re.IGNORECASE):
            return 'ack'
        tokens = lstrip.split(',')
        if self.data_to_cells(tokens):
            return 'pressure'
        return 'io'

    async def _recover_port(self) -> None:
        """Attempt to recover the serial port after a transient Windows ClearCommError.

        Strategy:
        - Flush input/output buffers (to_thread)
        - Short sleep
        - If port closed, try reopening (best effort)
        - Log outcome
        """
        try:
            if self.connection.is_open:
                try:
                    await asyncio.to_thread(self.connection.reset_input_buffer)
                    await asyncio.to_thread(self.connection.reset_output_buffer)
                except Exception as e:
                    self._log('error', f"Buffer reset failed: {e}")
            else:
                # Try to reopen if we have port info
                port = getattr(self.connection, 'port', None)
                baud = getattr(self.connection, 'baudrate', V_BAUDRATE)
                if port:
                    self._log('state', f"Reopening port {port}")
                    try:
                        new_conn = Serial(port=port, baudrate=baud, timeout=1.0)
                        self.connection = new_conn
                        self._log('state', 'Port reopened')
                    except Exception as e:
                        self._log('error', f"Port reopen failed: {e}")
            await asyncio.sleep(0.25)
        except Exception as e:
            self._log('error', f"Recovery routine error: {e}")
    
    
    
