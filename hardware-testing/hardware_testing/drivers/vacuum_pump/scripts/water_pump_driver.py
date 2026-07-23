"""Fixture Pump Driver."""

from serial import Serial  # type: ignore[import-untyped]
from typing import Optional, Protocol, Dict, List
import asyncio
import logging
import os
import time

LOG_DIR = "/data"
LOG_FILE = os.path.join(LOG_DIR, "water_pump.log")

os.makedirs(LOG_DIR, exist_ok=True)

_file_handler = logging.FileHandler(LOG_FILE)
_file_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
)
_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
)

log = logging.getLogger("water_pump")
log.setLevel(logging.DEBUG)
log.addHandler(_file_handler)
log.addHandler(_stream_handler)

COMMANDS = {
    "pumpOn": "ON",
    "pumpOff": "OFF",
    "autoOn": "AUTO ON",
    "autoOff": "AUTO OFF",
    "check": "CHECK",
    "reference": "REFERENCE",
    "level": "LEVEL",
    "status": "STATUS",
    "valve_on": "solenoid ON",
    "valve_off": "solenoid OFF",
}

"""Ready. Commands: ON, OFF, AUTO ON, AUTO OFF, CHECK, REFERENCE, LEVEL, STATUS"""

BAUDRATE = 115200
DEFAULT_V_TIMEOUT = 1
V_ACK = "\r\n"


class AbstractWaterPump(Protocol):
    """Protocol for mass flow sensor driver."""

    async def connect(self) -> None:
        """Connect to sensor."""
        ...

    async def disconnect(self) -> None:
        """Disconnect from sensor."""
        ...

    async def turn_motor_on(self) -> None:
        """Change the state of the Pump to on."""
        ...

    async def turn_motor_off(self) -> None:
        """Change the state of the Pump to off."""
        ...

    async def check_water_level(self) -> float:
        """Check the current water level."""
        ...

    async def water_fill_timer(self, run_time: int) -> None:
        """Check the current water level."""
        ...
        
    async def limit_water_fill(self, water_level: float) -> bool:
        """Run the pump for the specified water level in millimeters."""
        ...


class WaterPump(AbstractWaterPump):
    """Concrete implementation of the water pump driver over serial."""

    def __init__(self, connection: Serial) -> None:
        """Initialize WaterPump with a serial connection."""
        self.connection = connection
        self.st = time.perf_counter()
        self._logger = logging.getLogger("water_pump")

    @classmethod
    async def create(
        cls, port: str, baudrate: int, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "WaterPump":
        """Create a connection."""
        conn = Serial(port=port, baudrate=baudrate, timeout=1.0)
        return WaterPump(connection=conn)

    async def connect(self) -> None:
        """Open the serial connection if not already open."""
        try:
            if self.connection.is_open:
                self._logger.info("Connection already open")
            else:
                self.connection.open()
                self._logger.info("Connection opened")
        except Exception as e:
            raise e

    async def disconnect(self) -> None:
        """Disconnect."""
        try:
            if self.connection.is_open:
                self.connection.close()
                self._logger.info("Connection closed")
        except Exception as e:
            raise RuntimeError(f"Unable to disconnect: {e}") from e

    async def turn_motor_on(self) -> None:
        """Change the state of the Pump to on."""
        try:
            command = f"{COMMANDS['pumpOn']}{V_ACK}"
            print(f"{COMMANDS['pumpOn']}{V_ACK}")
            await asyncio.to_thread(self.connection.reset_input_buffer)
            # await asyncio.to_thread(self.connection.reset_output_buffer)
            await self._write(command.encode())
            self._logger.debug("Motor turned on")
        except Exception as e:
            self._logger.error(f"Failed to turn motor on: {e}")
            raise

    async def turn_motor_off(self) -> None:
        """Change the state of the Pump to off."""
        try:
            command = f"{COMMANDS['pumpOff']}{V_ACK}"
            print(f"{COMMANDS['pumpOff']}{V_ACK}")
            await asyncio.to_thread(self.connection.reset_input_buffer)
            # await asyncio.to_thread(self.connection.reset_output_buffer)
            await self._write(command.encode())
            self._logger.debug("Motor turned off")
        except Exception as e:
            self._logger.error(f"Failed to turn motor off: {e}")
            raise

    async def water_fill_timer(self, run_time: int) -> None:
        """Run the pump for the specified duration in seconds."""
        loop_st = time.perf_counter()
        self._logger.info(f"Starting water fill timer for {run_time}s")
        try:
            await self.turn_motor_on()
            while time.perf_counter() - loop_st < run_time:
                await asyncio.sleep(0.5)
            self._logger.info("Water fill timer complete")
        except Exception as e:
            self._logger.error(f"Water fill timer error: {e}")
            raise
        finally:
            await self.turn_motor_off()

    async def water_fill_auto(self, target: float) -> bool:
        self._logger.info(
            f"Starting water fill for target level {target} mm"
        )

        try:
            # Blocks until target level is reached
            state = await self.limit_water_fill(target)

            self._logger.info("Target water level reached")
            
        except Exception as e:
            self._logger.error(f"Water fill error: {e}")
            raise
        finally:
            await self.turn_motor_off()
            await asyncio.sleep(1)  # Allow time for the pump to stop
            return state

    async def limit_water_fill(self, water_level: float) -> bool:
        """Run the pump for the specified water level in millimeters."""
        current_water_level = await self.check_water_level()
        tolerance = 2  # Allowable tolerance in mm
        try:
            print(abs(current_water_level - water_level))
            while abs(current_water_level - water_level) > tolerance:
                current_water_level = await self.check_water_level()
                print(f"Current water level: {current_water_level} mm")
                print(abs(current_water_level - water_level))
                if current_water_level > water_level:
                    return True

        except Exception as e:
            self._logger.error(f"Water level read error: {e}")
            raise
        return True

    def parse_water_level_data(self, line: list[str]) -> List[float]:
        """Convert sensor output lines into a dictionary."""
        data = []
        for value in line:
            try:
                data.append(float(value))
            except ValueError:
                continue

        return data

    async def check_water_level(self) -> float:
        """Read and parse water level data."""
        command = f"{COMMANDS['level']}{V_ACK}"
        await asyncio.to_thread(self.connection.reset_input_buffer)
        await self._write(command.encode())

        try:
            while True:
                line = (await self._readline()).strip().split(",")
                if not line:
                    continue
                
                self._logger.info(f"Water level: {line}")
                # Stop after all expected values are received
                if len(line) >= 6:
                    break
                await self._write(command.encode())

            return self.parse_water_level_data(line)[len(line)-1]

        except Exception as e:
            self._logger.error(f"Water level read error: {e}")
            raise

    async def open_solenoid(self) -> None:
        """Open the solenoid valve."""
        command = f"{COMMANDS['valve_on']}{V_ACK}"
        await self._write(command.encode())
        self._logger.info("Solenoid opened")

    async def close_solenoid(self) -> None:
        """Close the solenoid valve."""
        command = f"{COMMANDS['valve_off']}{V_ACK}"
        await self._write(command.encode())
        self._logger.info("Solenoid closed")

    async def _write(self, data: bytes) -> None:
        """Non-blocking write operation."""
        try:
            # Offload write to another thread to avoid blocking the event loop
            print(f"Writing data: {data}")
            await asyncio.to_thread(self.connection.write, data)
        except Exception:
            raise

    async def _readline(self) -> str:
        """Non-blocking read operation."""
        try:
            # Offload readline to another thread to avoid blocking the event loop
            return (await asyncio.to_thread(self.connection.readline)).decode("utf-8")
        except Exception:
            raise

    # ---------------------- Logging Helpers ----------------------

    def set_log_level(self, level: int) -> None:
        """Set the log level (e.g. logging.DEBUG, logging.INFO, logging.WARNING)."""
        self._logger.setLevel(level)

    def disable_logging(self) -> None:
        """Suppress all log output from this driver."""
        self._logger.setLevel(logging.CRITICAL + 1)

    def enable_logging(self) -> None:
        """Re-enable logging at DEBUG level."""
        self._logger.setLevel(logging.DEBUG)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Water Pump Driver")
    parser.add_argument("--port", type=str, required=True, help="Serial port")
    parser.add_argument(
        "--baudrate", type=int, default=BAUDRATE, help="Serial baud rate"
    )
    args = parser.parse_args()

    async def main():
        # logging.disable(logging.INFO)  # Disable debug logging for the main function
        pump = await WaterPump.create(args.port, args.baudrate, asyncio.get_event_loop())
        await pump.connect()
        start_time = time.perf_counter()
        condition = True
        await pump.open_solenoid()  # Open the solenoid valve to allow water flow
        while condition:
            data = await pump.check_water_level()
            elasped_time = time.perf_counter() - start_time
            print(f"Time: {elasped_time} , {data}")
            water_reached = await pump.water_fill_auto(30)  # Example target level in mm
            print(f"Water reached: {water_reached}")
            if water_reached == True:
                condition = False
        await pump.close_solenoid()  # Close the solenoid valve to stop water flow
        # await pump.turn_motor_on()
        # await asyncio.sleep(1)  # Run the pump for 5 seconds
        # await pump.turn_motor_off()

        # await pump.disconnect()

    asyncio.run(main())