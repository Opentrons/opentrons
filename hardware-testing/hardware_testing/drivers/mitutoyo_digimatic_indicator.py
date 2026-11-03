"""Mitutoyo ABSOLUTE Digimatic Indicator ID-S.

The indicator is expected to answer the ASCII command ``r`` with one line
containing the measurement, for example ``1.234``. Surrounding text is ignored
when the line contains a decimal number.
"""
import argparse
import math
import re
import time
from typing import Optional

from serial import Serial  # type: ignore[import]
from serial.tools.list_ports import comports  # type: ignore[import]

DEFAULT_BAUDRATE = 9600
DEFAULT_SERIAL_TIMEOUT = 1.0
DEFAULT_READ_TIMEOUT = 2.0
STABLE_SAMPLE_COUNT = 5
# Two counts on a 0.001 mm ID-S, so a one-count flicker still counts as settled.
STABLE_TOLERANCE = 0.002
STABLE_TIMEOUT = 10.0
_READ_COMMAND = b"r"
_DECIMAL_READING = re.compile(r"[+-]?(?:\d+\.\d+|\.\d+)")


class Mitutoyo_Digimatic_Indicator:
    """Driver for a Mitutoyo dial indicator on a serial port."""

    def __init__(
        self,
        connection: Optional[Serial | str] = None,
        baudrate: int = DEFAULT_BAUDRATE,
        timeout: float = DEFAULT_SERIAL_TIMEOUT,
        *,
        port: Optional[str] = None,
    ) -> None:
        """Create a driver for an existing serial object or a device path.

        The port is not opened until :meth:`connect`. Pass either a device
        path or a ``Serial`` instance.

        Args:
            connection: Device path or an existing ``Serial`` instance.
            baudrate: Baud rate used when ``connection`` or ``port`` is a path.
            timeout: Serial read timeout, in seconds, for a newly created port.
            port: Device path. Keyword form used by existing callers.

        Raises:
            ValueError: No port was given, or both a path and a connection were.
        """
        if port is not None and connection is not None:
            raise ValueError("Pass a port or a connection, not both.")
        source: Optional[Serial | str] = port if port is not None else connection
        if isinstance(source, str):
            self.connection = _serial_port(source, baudrate, timeout)
        elif source is None:
            raise ValueError("A serial port or connection is required.")
        else:
            self.connection = source

    @classmethod
    def create(
        cls,
        port: Optional[str] = None,
        baudrate: int = DEFAULT_BAUDRATE,
        timeout: float = DEFAULT_SERIAL_TIMEOUT,
        connection: Optional[Serial | str] = None,
    ) -> "Mitutoyo_Digimatic_Indicator":
        """Build an indicator for a serial port.

        Args:
            port: Serial device path, for example ``/dev/ttyUSB0``.
            baudrate: Baud rate. Ignored when ``connection`` is a ``Serial``.
            timeout: Serial read timeout in seconds.
            connection: Existing ``Serial`` instance, or a device path.

        Returns:
            An indicator. The port stays closed until :meth:`connect`.

        Raises:
            ValueError: Neither a port nor a connection was provided.
        """
        if isinstance(connection, str) and port is None:
            port = connection
            connection = None
        if isinstance(connection, Serial):
            return cls(connection)
        if port is None:
            raise ValueError("A serial port or connection is required.")
        return cls(port, baudrate=baudrate, timeout=timeout)

    def connect(self) -> None:
        """Open the serial port.

        Does nothing when the port is already open.
        """
        if not self.connection.is_open:
            self.connection.open()

    def disconnect(self) -> None:
        """Close the serial port.

        Does nothing when the port is already closed.
        """
        if not self.connection.is_open:
            return
        try:
            self.connection.reset_input_buffer()
            self.connection.reset_output_buffer()
        finally:
            self.connection.close()

    def __enter__(self) -> "Mitutoyo_Digimatic_Indicator":
        """Open the port and return this driver."""
        self.connect()
        return self

    def __exit__(self, *_exc: object) -> None:
        """Close the port."""
        self.disconnect()

    def read(self, timeout: Optional[float] = None) -> float:
        """Request one measurement.

        Opens the port when it is closed. Non-numeric lines are skipped until
        a reading arrives or the timeout expires.

        Args:
            timeout: Seconds to wait for a numeric line. When omitted, uses
                the serial port timeout, or 2 seconds when that timeout is unset.

        Returns:
            The measurement in the indicator's current units.

        Raises:
            TimeoutError: No numeric reading arrived before the timeout.
            ValueError: ``timeout`` is negative.
        """
        self.connect()
        deadline_s = self._timeout_seconds(timeout)
        deadline = time.monotonic() + deadline_s
        self.connection.reset_input_buffer()
        self.connection.write(_READ_COMMAND)
        self.connection.flush()

        last_payload = ""
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                detail = f" (last payload: {last_payload!r})" if last_payload else ""
                raise TimeoutError(
                    f"no dial reading within {deadline_s} seconds{detail}"
                )
            raw = self._readline(remaining)
            if not raw:
                continue
            last_payload = raw.decode("ascii", errors="replace")
            try:
                return _parse_reading(last_payload)
            except ValueError:
                continue

    def read_stable(
        self,
        samples: int = STABLE_SAMPLE_COUNT,
        tolerance: float = STABLE_TOLERANCE,
        timeout: float = STABLE_TIMEOUT,
    ) -> float:
        """Read until consecutive samples agree.

        Agreement is the spread of the window, not a palindrome of the
        samples. A window such as ``1, 5, 0, 5, 1`` is not stable.

        Args:
            samples: Number of consecutive readings that must agree.
            tolerance: Maximum allowed difference between those readings.
            timeout: Seconds to wait for a stable set, including serial reads.

        Returns:
            The most recent reading from the stable set.

        Raises:
            TimeoutError: Readings did not settle, or a sample did not arrive.
            ValueError: ``samples``, ``tolerance``, or ``timeout`` is invalid.
        """
        if samples < 1:
            raise ValueError("samples must be at least 1")
        if tolerance < 0:
            raise ValueError("tolerance must be non-negative")
        if timeout <= 0:
            raise ValueError("timeout must be positive")

        deadline = time.monotonic() + timeout
        window: list[float] = []
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(_unstable_message(timeout, window))
            per_read = min(self._timeout_seconds(None), remaining)
            window.append(self.read(timeout=per_read))
            if len(window) > samples:
                del window[0]
            if len(window) == samples and max(window) - min(window) <= tolerance:
                return window[-1]

    def _timeout_seconds(self, timeout: Optional[float]) -> float:
        if timeout is not None:
            if timeout < 0:
                raise ValueError("timeout must be non-negative")
            return timeout
        serial_timeout = self.connection.timeout
        if isinstance(serial_timeout, (int, float)) and serial_timeout > 0:
            return float(serial_timeout)
        return DEFAULT_READ_TIMEOUT

    def _readline(self, remaining: float) -> bytes:
        previous_timeout = self.connection.timeout
        self.connection.timeout = remaining
        try:
            line = self.connection.readline()
        finally:
            self.connection.timeout = previous_timeout
        return bytes(line)


def _serial_port(port: str, baudrate: int, timeout: float) -> Serial:
    if baudrate <= 0:
        raise ValueError("baudrate must be positive")
    if timeout < 0:
        raise ValueError("timeout must be non-negative")
    connection = Serial()
    connection.port = port
    connection.baudrate = baudrate
    connection.timeout = timeout
    return connection


def _parse_reading(payload: str) -> float:
    """Return the measurement stored in one indicator line.

    Raises:
        ValueError: The line is empty, non-numeric, or not finite.
    """
    text = payload.strip()
    if not text:
        raise ValueError("empty reading")
    try:
        value = float(text)
    except ValueError:
        match = _DECIMAL_READING.search(text)
        if match is None:
            raise ValueError(f"unrecognized dial reading: {text!r}") from None
        value = float(match.group(0))
    if not math.isfinite(value):
        raise ValueError(f"non-finite dial reading: {text!r}")
    return value


def _unstable_message(timeout: float, window: list[float]) -> str:
    detail = ""
    if len(window) >= 2:
        detail = f" (spread {max(window) - min(window):.6f})"
    return f"dial reading did not settle within {timeout} seconds{detail}"


def find_dial(
    baudrate: int = DEFAULT_BAUDRATE,
) -> Optional[Mitutoyo_Digimatic_Indicator]:
    """Return the first indicator that answers a read request.

    Ports that do not respond are closed. The returned indicator is left
    connected.

    Args:
        baudrate: Baud rate used while probing each port.

    Returns:
        A connected indicator, or None when no port answers.
    """
    for port_info in comports():
        device = getattr(port_info, "device", None)
        if not isinstance(device, str):
            continue
        dial: Optional[Mitutoyo_Digimatic_Indicator] = None
        try:
            dial = Mitutoyo_Digimatic_Indicator(port=device, baudrate=baudrate)
            dial.connect()
            dial.read(timeout=1.0)
        except Exception:
            # Opening the wrong serial device can fail in several ways.
            # Keep scanning, and don't leave that port open.
            if dial is not None:
                try:
                    dial.disconnect()
                except Exception:
                    pass
            continue
        return dial
    return None


def _main() -> None:
    parser = argparse.ArgumentParser(
        description="Print readings from a Mitutoyo ABSOLUTE Digimatic indicator."
    )
    parser.add_argument("--port", default="/dev/ttyUSB0")
    parser.add_argument("--baudrate", type=int, default=DEFAULT_BAUDRATE)
    args = parser.parse_args()
    gauge = Mitutoyo_Digimatic_Indicator(port=args.port, baudrate=args.baudrate)
    with gauge:
        start = time.monotonic()
        while True:
            elapsed = time.monotonic() - start
            print(f"Time: {elapsed:.3f} Distance: {gauge.read()}")


if __name__ == "__main__":
    try:
        _main()
    except KeyboardInterrupt:
        print()
