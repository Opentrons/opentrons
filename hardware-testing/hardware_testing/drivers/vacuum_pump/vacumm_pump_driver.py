# Vacuum Pump Driver
from serial import Serial # type: ignore[import]
from abc import ABC, abstractmethod
from typing import List, Optional
from time import time
import asyncio
import logging
from opentrons.drivers.asyncio.communication import AsyncResponseSerialConnection


COMMANDS = {'Pump_State': 'TurnOnPump', 
            'Set_Pressure': 'SetPressure'}
"""
The commands:
TurnOnPump:1
Will enable the pump to start controlling the pressure
SetPressure:<pressure in mbarr>
Will set the pressure setpoint in absolute mbarr of pressure.
So if you want a vacuum pressure of -100mbarr, that would be:
SetPressure:900
since atmospheric pressure is ~1000mbarr
"""

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
    def set_pressure(self, int: int = 1.0) -> int:
        """Set Pressure."""
        ...

    @abstractmethod
    def read_continous_data(self, duration: int = 1.0) -> List:
        """Read continous data."""
        ...


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
            # logger.error(f"Error reading from force gauge: {e} ")
            raise(e)

    async def set_pressure(self, pressure: int):
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

    
