"""Fixture Pump Driver."""

from serial import Serial  # type: ignore[import]
from typing import Optional, Set
import asyncio
import time

COMMANDS = {
    "pumpOn": "ON",
    "pumpOff": "OFF",
    "autoOn": "AUTO ON",
    "autoOff": "AUTO OFF",
    "check": "CHECK",
    "status": "STATUS",
}

"""Ready. Commands: ON, OFF, AUTO ON, AUTO OFF, CHECK, STATUS"""

BAUDRATE = 115200
DEFAULT_V_TIMEOUT = 1
V_ACK = "\r\n"


class WaterPump:
    """Waater pump."""

    def __init__(self, connection: Serial) -> None:
        """Init."""
        self.connection = connection
        self.st = time.perf_counter()
        # Logging controls
        self._logging_enabled: bool = True
        self._log_categories: Optional[Set[str]] = None  # None => all

    @classmethod
    async def create(
        cls, port: str, baudrate: int, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "WaterPump":
        """Create a connection."""
        conn = Serial(port=port, baudrate=baudrate, timeout=1.0)
        return WaterPump(connection=conn)

    async def connect(self) -> None:
        """Connect."""
        try:
            if self.connection.is_open:
                self._log("state", "Connection open")
        except Exception as e:
            raise e

    async def disconnect(self) -> None:
        """Disconnect."""
        try:
            if self.connection.is_open:
                self.connection.close()
                print("Connection close")
        except Exception as e:
            raise RuntimeError(f"Unable to connect: {e}") from e

    async def turn_motor_on(self) -> str:
        """Change the state of the Pump, either on or off."""
        command = f"{COMMANDS['pumpOn']}{V_ACK}"
        await asyncio.to_thread(self.connection.reset_input_buffer)
        await asyncio.to_thread(self.connection.reset_output_buffer)
        await self._write(command.encode())
        try:
            while True:
                line = await self._readline()
                self._log("Motor:", line)
                if line != "":
                    return line
        except Exception as e:
            self._log("error", f"Continuous read error: {e}")
            raise (e)

    async def turn_motor_off(self) -> str:
        """Change the state of the Pump, either on or off."""
        command = f"{COMMANDS['pumpOff']}{V_ACK}"
        await asyncio.to_thread(self.connection.reset_input_buffer)
        await asyncio.to_thread(self.connection.reset_output_buffer)
        await self._write(command.encode())
        try:
            while True:
                line = await self._readline()
                self._log("Motor:", line)
                if line != "":
                    return line
        except Exception as e:
            self._log("error", f"Continuous read error: {e}")
            raise (e)

    async def check_water_level(self) -> str:
        """Change the state of the Pump, either on or off."""
        command = f"{COMMANDS['CHECK']}{V_ACK}"
        await self._write(command.encode())
        try:
            while True:
                line = await self._readline()
                self._log("Water Level:", line)
        except Exception as e:
            self._log("error", f"Continuous read error: {e}")
            raise (e)

    async def _write(self, data: bytes) -> None:
        """Non-blocking write operation."""
        try:
            # Offload write to another thread to avoid blocking the event loop
            await asyncio.to_thread(self.connection.write, data)
        except Exception as e:
            raise (e)

    async def _readline(self) -> str:
        """Non-blocking read operation."""
        try:
            # Offload readline to another thread to avoid blocking the event loop
            return (await asyncio.to_thread(self.connection.readline)).decode("utf-8")
        except Exception as e:
            raise (e)
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
