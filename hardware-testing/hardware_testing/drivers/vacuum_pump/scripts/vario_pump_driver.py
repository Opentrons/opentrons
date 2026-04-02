"""Vacuum Pump Driver."""

import serial  # type: ignore[import]
from serial import Serial  # type: ignore[import]
from typing import List, Optional
import time
import asyncio
import csv


COMMANDS = {
    "Start": "START",
    "STOP": "STOP",
}

RESPONSE = {
    "Start": "1",
    "STOP": "0",
    "REMOTE": "0",
    "IN_PV_1": "hPa",
    "IN_PV_3": "h:m",
    "IN_PV_X": None,
}

# This value may need to be found through trial and error
DEVICE_NAME = "dev/ttyUSB0"

# These values should be in the device documentation
V_BAUDRATE = 19200
SERIAL_ACK = "\n"
READ_TIMEOUT = 0.5
WRITE_TIMEOUT = 0.5


class VarioPump:
    """Vario Pump Driver."""

    def __init__(self, connection: Serial, csv_path: str = "pump_test.csv") -> None:
        """Initialize VarioPump with a serial connection and optional CSV path."""
        self.connection = connection
        self._stop_requested = False
        self._csv_initialized = False
        self.csv_path = csv_path
        self.pressure_set = None
        self.st = time.perf_counter()

    @classmethod
    async def create(
        cls, port: str, baudrate: int, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "VarioPump":
        """Create a Vacuum Pump Driver."""
        conn = Serial(
            port=port,
            baudrate=baudrate,
            bytesize=serial.EIGHTBITS,  # Set data bits to 8
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=READ_TIMEOUT,
            write_timeout=WRITE_TIMEOUT,
            rtscts=False,
        )
        return VarioPump(connection=conn)

    async def connect(self) -> None:
        """Open the serial connection if not already open."""
        try:
            if self.connection.is_open:
                print("Connection Connected")
        except Exception as e:
            raise (e)

    async def disconnect(self) -> None:
        """Disconnect."""
        try:
            if self.connection.is_open:
                self.connection.close()
                print("Connection close")
        except Exception as e:
            raise RuntimeError(f"Unable to connect: {e}") from e

    async def _reset_buffers(self) -> None:
        self.connection.reset_input_buffer()
        self.connection.reset_output_buffer()

    async def _send_command(self, my_command: str) -> None:
        await self._reset_buffers()
        command = my_command
        command += SERIAL_ACK
        commands = bytes(command.encode("utf-8"))
        # print(f"writing {command}")
        try:
            await asyncio.to_thread(self.connection.write, commands)
        except Exception as e:
            raise (e)
        self.connection.flush()

    async def _select_vacuum_control(self) -> str:
        await self._send_command("OUT_APP 6")
        response = await self._read_response()
        return response

    def _decode_lines(self, lines: List[bytes]) -> str:
        """Fast decode of a list of byte lines into a single string.

        Uses a single bytes join followed by a single decode to avoid
        O(n^2) string concatenation in a loop.
        """
        if not lines:
            return ""
        return b"".join(lines).decode("utf-8", errors="ignore")

    async def _read_response(self) -> str:
        try:
            output_lines = await asyncio.to_thread(self.connection.readlines)
            decoded = self._decode_lines(output_lines)
            if decoded:
                print(f"message: {decoded!r}", flush=True)
            await self._reset_buffers()
            return decoded
        except Exception as e:
            raise e

    async def _read_pressure_response(self) -> str:
        try:
            output_lines = await asyncio.to_thread(self.connection.readlines)
            decoded = self._decode_lines(output_lines)
            if decoded:
                print(f"message: {decoded!r}", flush=True)
            await self._reset_buffers()
            return decoded
        except Exception as e:
            raise e
        # self.connection.flush()

    async def _set_vacuum_pressure(self, setpoint: float) -> str:
        await self._send_command(f"OUT_SP_1 {setpoint}")
        response = await self._read_response()
        print(response)
        return response

    async def _set_pump_speed(self, speed: float) -> str:  # speed in percent (ex. 85.3)
        await self._send_command(f"OUT_SP_2 {speed}")
        response = await self._read_response()
        return response

    async def _select_pumpdown(self) -> str:
        await self._send_command("OUT_APP 0")
        response = await self._read_response()
        return response

    async def _select_pumpdown_and_hold(self) -> str:
        await self._send_command("OUT_APP 4")
        response = await self._read_response()
        return response

    async def change_pressure_units(self) -> None:
        """Change the pressure unit configuration on the pump."""
        pass
        # await self._send_command("OUT_CFG_")

    async def _start_process(self) -> str:
        await self._send_command("START")
        response = await self._read_response()
        print(f"Start: {response}", flush=True)
        return response

    async def _stop_process(self) -> str:
        await self._send_command("STOP")
        response = await self._read_response()
        return response

    async def read_pressure_sensor(self) -> str:
        """Read the current pressure sensor value."""
        await self._send_command("IN_PV_1")
        response = await self._read_response()
        return response

    async def echo_mode(self) -> str:
        """Set the pump echo mode."""
        await self._send_command("ECHO 0")
        response = await self._read_response()
        return response

    async def set_comms_mode(self) -> str:
        """Set the pump communication mode."""
        await self._send_command("CVC 4")
        response = await self._read_response()
        return response

    async def set_remote_control(self) -> str:
        """Enable remote control mode on the pump."""
        await self._send_command("REMOTE 2")
        response = await self._read_response()
        return response

    async def pump_down(self) -> str:
        """Start a pumpdown sequence."""
        await self._select_pumpdown()
        await self._start_process()
        response = await self._read_response()
        return response

    async def open_vent(self) -> str:
        """Open the vent valve."""
        await self._send_command("OUT_VENT 1")
        response = await self._read_response()

        return response

    async def close_vent(self) -> str:
        """Close the vent valve."""
        await self._send_command("OUT_VENT 2")
        response = await self._read_response()
        return response

    async def initiate_pump_control(self) -> None:
        """Initialize pump control by setting echo, comms, and remote modes."""
        await self.echo_mode()
        await self.set_comms_mode()
        await self.set_remote_control()

    async def vacuum_program(self, speed: float = 100, seconds: float = 10) -> None:
        """Run a full vacuum program at the given speed for the given duration."""
        await self.close_vent()
        await self._select_pumpdown()
        await self._set_pump_speed(speed)
        await self._start_process()
        await asyncio.sleep(seconds)
        await self._stop_process()
        await self.open_vent()

    async def _write_to_csv(self, timestamp: float, data: List[float]) -> None:
        """Append a data line to the CSV file (offloaded to a thread).

        Expects `data` to have at least 4 numeric elements: [PA_FILTERED, PA_RAW, PB_FILTERED, PB_RAW].
        Adds the current `pressure_set` as the last column (may be None).
        """
        if len(data) == 0:
            # Skip malformed/short lines quietly; caller should already filter, but be defensive
            return

        def _append() -> None:
            write_header = not self._csv_initialized
            with open(self.csv_path, "a", newline="") as f:
                writer = csv.writer(f)
                if write_header:
                    writer.writerow(
                        ["timestamp", "PA_FILTERED", "PB_FILTERED", "SET_PRESSURE"]
                    )
                    self._csv_initialized = True
                writer.writerow(
                    [
                        f"{timestamp:.2f}",
                        f"{data[0]:.2f}",
                        self.pressure_set if self.pressure_set is not None else 0,
                    ]
                )

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
        # if len(nums) < 1:
        #     return None
        # Keep the first 4 values in expected order
        return nums

    async def read_continuous_data(self) -> None:
        """Read and print continuous data from the vacuum pump for the specified timeout duration."""
        try:
            while True:
                line = await self.read_pressure_sensor()
                # print(line)
                if not line.strip():
                    # No data -> possible end of stream or timeout
                    if self._stop_requested:
                        print("Device stopped sending data.")
                        break
                    await asyncio.sleep(0.1)
                    continue
                tokens = line.strip().split()
                data = self.data_to_cells(tokens)
                if data is None:
                    # Not enough numeric data on this line; skip
                    continue
                # Timestamp
                ts = time.perf_counter() - self.st
                # Record to csv
                # TODO make this optional later
                await self._write_to_csv(ts, data)
        except Exception as e:
            raise (e)
