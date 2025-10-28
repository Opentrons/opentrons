"""Vacuum Pump Driver"""

from serial import Serial # type: ignore[import]
from abc import ABC, abstractmethod
from typing import List, Optional
import time
import asyncio
import logging
import csv
from datetime import datetime


COMMANDS = {'Pump_State': 'TurnOnPump', 
            'Set_Pressure': 'SetPressure'}

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

    def read_continous_data(self, pressure: float) -> float:
        """Set simulation pressure."""
        self._pressure = pressure


class OpentronsVacuum():
    """Vacuum pump Driver"""
    def __init__(self, connection: Serial, csv_path: str = "pump_test.csv"):
        self.connection = connection
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.pressure_set = None
        self.st = time.perf_counter()

    @classmethod
    async def create(cls, port: str, baudrate: int, loop: Optional[asyncio.AbstractEventLoop]) -> "OpentronsVacuum":
        """Create a Opentrons Vacuum driver."""
        conn = Serial(port=port, baudrate=baudrate, timeout=1.0)
        return OpentronsVacuum(connection = conn)
    
    async def connect(self)-> None:
        try:
            if self.connection.is_open:
                print('Connection Connected')
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
            return (await asyncio.to_thread(self.connection.readline)).decode("utf-8")
        except Exception as e:
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
        print("Stop Pump")

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
                    writer.writerow(["timestamp", "PA_FILTERED", "PA_RAW", "PB_FILTERED", "PB_RAW", "SET_PRESSURE"])
                    self._csv_initialized = True
                writer.writerow([
                    f"{timestamp:.6f}",
                    f"{data[0]:.6f}",
                    f"{data[1]:.6f}",
                    f"{data[2]:.6f}",
                    f"{data[3]:.6f}",
                    self.pressure_set if self.pressure_set is not None else "",
                ])

        await asyncio.to_thread(_append)

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
                        print("Device stopped sending data.")
                        break
                    await asyncio.sleep(0.1)
                    continue
                # print(line)
                tokens = line.strip().split(',')
                data = self.data_to_cells(tokens)
                if data is None:
                    # Not enough numeric data on this line; skip
                    continue
                # Timestamp
                ts = time.perf_counter() - self.st
                #Record to csv
                # TODO make this optional later
                await self._write_to_csv(ts, data)
        except Exception as e:
            raise(e)
    
    
    
