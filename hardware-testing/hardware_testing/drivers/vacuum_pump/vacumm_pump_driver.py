"""Vacuum Pump Driver"""

from serial import Serial # type: ignore[import]
from abc import ABC, abstractmethod
from typing import List, Optional
from time import time
import asyncio
import logging


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
    def set_pressure(self, pressure: int = 1000) -> int:
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

    def set_pressure(self, timeout: float = 1.0) -> float:
        """Read Force."""
        return self._pressure

    def read_continous_data(self, pressure: float) -> None:
        """Set simulation pressure."""
        self._pressure = pressure


class OpentronsVacuum():
    """Vacuum pump Driver"""
    def __init__(self, connection: Serial):
        self.connection = connection
        self._units = "mbar"

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

    async def change_pump_state(self, state: int):
        command = COMMANDS['Pump_State'] + ':'+  str(state) + V_ACK
        print(command.encode())
        await self._write(command.encode())

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

    async def set_pressure(self, pressure: int):
        """Pressure(mbar), 1ATM is ~1000mbar"""
        # Relative pressure from ~ATM, EX set 900, would be 100mbar 1000-900mbar
        command = COMMANDS['Set_Pressure'] + ':'+  str(pressure) + V_ACK
        print(command.encode())
        await self._write(command.encode())

    async def read_continous_data(self, Duration: int = 10):
        """Read and print continuous data from the vacuum pump for the specified timeout duration."""
        try:
            start_time = time()
            while time() - start_time < Duration:
                # Read the line asynchronously
                line = None
                try:
                    line = await self._readline()
                    print(line)
                except ValueError as e:
                    print(e)
                    print(f'bad data: "{line}"')
        except Exception as e:
            raise(e)

    
