"""Driver for the LCUS-4 fan controller.

The controller uses a CH340 USB-to-serial bridge and a line-oriented ASCII
protocol. Commands are terminated with CRLF::

    FAN_ON, FAN_OFF, STATUS, VERSION, HELP

The current fixture firmware exposes one fan output. ``channel_1_on`` and
``channel_1_off`` remain available as compatibility aliases for existing
fixture protocols.
"""

import abc
import logging
import os
import re
import termios
import time
from abc import ABC
from dataclasses import dataclass
from typing import Dict, Mapping, Optional, Sequence, Tuple

import serial  # type: ignore
from serial.serialutil import SerialException  # type: ignore
from serial.tools.list_ports import comports  # type: ignore

from hardware_testing.data import ui

log = logging.getLogger(__name__)

# The documentation identifies the USB bridge as CH340 but does not specify a
# stable VID/PID.  Protocol probing is therefore used for discovery instead of
# rejecting ports based on a bridge-specific identifier.
USB_VID: Optional[int] = None
USB_PID: Optional[int] = None

DEVICE_NAME = "LCUS-4"
BAUDRATE = 115200
CHANNELS: Tuple[int] = (1,)
COMMAND_RESPONSE_TIMEOUT_SECONDS = 1.0
COMMAND_RESPONSE_POLL_INTERVAL_SECONDS = 0.01
SERIAL_COMMAND_RETRIES = 1
SERIAL_RETRY_DELAY_SECONDS = 1.0
SERIAL_STARTUP_DELAY_SECONDS = 2.0

COMMAND_TERMINATOR = "\r\n"


def _command_bytes(command: str) -> bytes:
    """Encode one controller command with its required line terminator."""
    return f"{command}{COMMAND_TERMINATOR}".encode("ascii")


CMD_FAN_ON = _command_bytes("FAN_ON")
CMD_FAN_OFF = _command_bytes("FAN_OFF")
CMD_STATUS = _command_bytes("STATUS")
CMD_VERSION = _command_bytes("VERSION")
CMD_HELP = _command_bytes("HELP")

# Public aliases retained for callers that use the older names.
CMD_GET_STATUS = CMD_STATUS
CMD_QUERY_STATUS = CMD_STATUS
CMD_CHANNEL_1_ON = CMD_FAN_ON
CMD_CHANNEL_1_OFF = CMD_FAN_OFF
CMD_CH1_ON = CMD_FAN_ON
CMD_CH1_OFF = CMD_FAN_OFF
# Deprecated aliases for code that imported the former second-channel names.
CMD_CHANNEL_2_ON = CMD_FAN_ON
CMD_CHANNEL_2_OFF = CMD_FAN_OFF
CMD_CH2_ON = CMD_FAN_ON
CMD_CH2_OFF = CMD_FAN_OFF


def _port_is_open_in_this_process(device: str) -> bool:
    """Return whether this process already has the serial device open."""
    fd_dir = "/proc/self/fd"
    try:
        device_path = os.path.realpath(device)
        for fd_name in os.listdir(fd_dir):
            try:
                fd_path = os.path.join(fd_dir, fd_name)
                if os.path.realpath(fd_path) == device_path:
                    return True
            except OSError:
                continue
    except OSError:
        # Non-Linux development environments may not expose /proc/self/fd.
        return False
    return False


class LCUS4Error(RuntimeError):
    """LCUS-4 relay module error."""


@dataclass(frozen=True)
class RelayState:
    """Result of changing one relay channel."""

    channel: int
    enabled: bool
    command: bytes
    raw_response: str = ""

    @property
    def on(self) -> bool:
        """Whether the relay is energized."""
        return self.enabled


@dataclass(frozen=True)
class RelayStatus:
    """Status returned by the controller's ``STATUS`` query."""

    channels: Mapping[int, bool]
    raw_response: str

    @property
    def states(self) -> Mapping[int, bool]:
        """Alias for callers that use ``states`` terminology."""
        return self.channels

    @property
    def channel_1(self) -> bool:
        """State of channel 1."""
        return self.channels[1]

    @property
    def channel_2(self) -> bool:
        """Return false for the removed second legacy channel."""
        return self.channels.get(2, False)

    def is_on(self, channel: int) -> bool:
        """Return the state of ``channel``."""
        if channel == 2:
            # Keep status consumers written for the old two-relay fixture
            # harmless while the firmware exposes only the fan output.
            return False
        _validate_channel(channel)
        return self.channels[channel]


def _validate_channel(channel: int) -> None:
    """Validate a user-facing relay channel number."""
    if isinstance(channel, bool) or channel not in CHANNELS:
        raise LCUS4Error(
            f"Unsupported LCUS-4 channel {channel!r}; only fan channel 1 "
            "is available"
        )


def _command_for_channel(channel: int, enabled: bool) -> bytes:
    """Return the fan command for the compatibility channel 1 API."""
    _validate_channel(channel)
    return CMD_FAN_ON if enabled else CMD_FAN_OFF


def _parse_fan_state_response(response: str) -> bool:
    """Parse common ``STATUS`` response forms and return the fan state."""
    normalized = response.strip().upper()
    state_match = re.search(
        r"\b(?:FAN(?:[_ ](?:STATUS|STATE))?|STATUS)\s*[:=]?\s*"
        r"(?:FAN[_ ]*)?(ON|OFF)\b",
        normalized,
    )
    if state_match is None:
        state_match = re.search(r"\bFAN_(ON|OFF)\b", normalized)
    if state_match is None:
        state_match = re.fullmatch(r"(ON|OFF)", normalized)
    if state_match is None:
        raise LCUS4Error(
            "Invalid LCUS-4 status response; expected a FAN_ON/FAN_OFF state, "
            f"received {response!r}"
        )
    return state_match.group(1) == "ON"


def _normalize_version_response(response: str) -> str:
    """Normalize the firmware's ``VERSION FAN_1.0.0`` response."""
    normalized = response.strip()
    version_match = re.search(
        r"\bFAN[_ ](\d+(?:\.\d+)+)\b", normalized, re.IGNORECASE
    )
    if version_match:
        return f"FAN {version_match.group(1)}"
    return normalized


def _parse_status_response(response: str) -> Dict[int, bool]:
    """Parse a fan status response into the legacy channel mapping."""
    matches = re.findall(r"CH\s*([0-9]+)\s*[:：]\s*(ON|OFF)", response, re.I)
    states: Dict[int, bool] = {}
    for channel_text, state_text in matches:
        channel = int(channel_text)
        if channel == 1:
            states[channel] = state_text.upper() == "ON"

    if states:
        return states
    return {1: _parse_fan_state_response(response)}


class LCUS4Base(ABC):
    """Abstract interface for the LCUS-4 fan fixture."""

    @classmethod
    def vid_pid(cls) -> Tuple[Optional[int], Optional[int]]:
        """Return the configured USB identity, if one is known."""
        return USB_VID, USB_PID

    @abc.abstractmethod
    def get_version(self) -> str:
        """Return a human-readable device identification string."""
        ...

    @abc.abstractmethod
    def get_status(self) -> RelayStatus:
        """Read the state of the fan output."""
        ...

    def get_help(self) -> str:
        """Return the commands supported by the controller."""
        return "FAN_ON, FAN_OFF, STATUS, VERSION, HELP"

    @abc.abstractmethod
    def set_channel(self, channel: int, enabled: bool) -> RelayState:
        """Turn one relay channel on or off."""
        ...

    def turn_on(self, channel: int) -> RelayState:
        """Energize one relay channel."""
        return self.set_channel(channel, True)

    def turn_off(self, channel: int) -> RelayState:
        """De-energize one relay channel."""
        return self.set_channel(channel, False)

    def fan_on(self) -> RelayState:
        """Turn on the fixture fan."""
        return self.channel_1_on()

    def fan_off(self) -> RelayState:
        """Turn off the fixture fan."""
        return self.channel_1_off()

    def switch_on(self, channel: int) -> RelayState:
        """Alias for :meth:`turn_on`."""
        return self.turn_on(channel)

    def switch_off(self, channel: int) -> RelayState:
        """Alias for :meth:`turn_off`."""
        return self.turn_off(channel)

    def set_relay(self, channel: int, enabled: bool) -> RelayState:
        """Alias for :meth:`set_channel`."""
        return self.set_channel(channel, enabled)

    def get_relay_status(self) -> RelayStatus:
        """Alias for :meth:`get_status`."""
        return self.get_status()

    def channel_1_on(self) -> RelayState:
        """Turn on channel 1."""
        return self.turn_on(1)

    def channel_1_off(self) -> RelayState:
        """Turn off channel 1."""
        return self.turn_off(1)

    def channel_2_on(self) -> RelayState:
        """Reject the removed second relay channel."""
        return self.turn_on(2)

    def channel_2_off(self) -> RelayState:
        """Reject the removed second relay channel."""
        return self.turn_off(2)

    def all_off(self) -> Tuple[RelayState, RelayState]:
        """Turn off the fan.

        The two-item return shape is retained for compatibility with callers
        written for the original two-channel relay implementation.
        """
        state = self.channel_1_off()
        return state, state

    @abc.abstractmethod
    def close(self) -> None:
        """Close the serial connection, if any."""
        ...


class LCUS4Serial(LCUS4Base):
    """Serial implementation of the LCUS-4 fan controller."""

    def __init__(
        self,
        baudrate: int = BAUDRATE,
        timeout: float = 1.0,
        ctx=None,
    ) -> None:
        self._baudrate = baudrate
        self._timeout = timeout
        self._ser: Optional[serial.Serial] = None
        self.port: Optional[str] = None
        self._skip_ports: list[str] = []
        self._last_status: Optional[RelayStatus] = None
        self.ctx = ctx

    def connect(
        self,
        autosearch: bool = True,
        port: str = "",
        skip_port: Optional[Sequence[str]] = None,
    ) -> bool:
        """Find and connect to an LCUS-4 by probing the status command."""
        del autosearch  # Kept for compatibility with the other fixture drivers.
        if isinstance(skip_port, str):
            self._skip_ports = [skip_port]
        else:
            self._skip_ports = list(skip_port or [])

        devices = [getattr(port_info, "device", "") for port_info in comports()]
        if port and not any(port == device for device in devices):
            # A caller may know a port that is not currently returned by the
            # platform enumerator (common with manually-created symlinks).
            devices.append(port)
        if not devices:
            raise LCUS4Error("No serial ports found")

        for device in devices:
            if port and port not in device:
                continue
            if any(skip in device for skip in self._skip_ports):
                continue
            if _port_is_open_in_this_process(device):
                log.info("Skipping serial port already in use: %s", device)
                continue

            ser: Optional[serial.Serial] = None
            try:
                if self.ctx:
                    self.ctx.delay(seconds=0.1, msg=f"Trying LCUS-4 port {device}")
                ser = serial.Serial(
                    port=device,
                    baudrate=self._baudrate,
                    timeout=self._timeout,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    bytesize=serial.EIGHTBITS,
                )
                time.sleep(SERIAL_STARTUP_DELAY_SECONDS)
                status = self._query_status(ser)
                self._ser = ser
                self.port = device
                self._last_status = status
                return True
            except (LCUS4Error, OSError, SerialException, termios.error) as error:
                log.debug("Port %s is not an LCUS-4: %s", device, error)
                if ser:
                    try:
                        ser.close()
                    except (OSError, SerialException, termios.error):
                        pass

        raise LCUS4Error("Target LCUS-4 relay device not found")

    @staticmethod
    def _waiting(ser: serial.Serial) -> int:
        """Read buffered-byte count across pyserial API generations."""
        try:
            return int(ser.in_waiting)
        except (AttributeError, SerialException, OSError):
            return int(ser.inWaiting())  # type: ignore[attr-defined]

    @staticmethod
    def _reset_buffers(ser: serial.Serial, port: str) -> None:
        try:
            reset_input = getattr(ser, "reset_input_buffer", None)
            if reset_input is None:
                reset_input = ser.flushInput
            reset_output = getattr(ser, "reset_output_buffer", None)
            if reset_output is None:
                reset_output = ser.flushOutput
            reset_input()
            reset_output()
        except (SerialException, OSError, termios.error) as error:
            raise LCUS4Error(
                f"Failed to flush LCUS-4 serial buffers on {port}: {error}"
            ) from error

    def _read_response(
        self,
        ser: serial.Serial,
        timeout: float,
        stop_when_complete: bool = False,
    ) -> bytes:
        """Read available bytes until timeout or a complete status is seen."""
        deadline = time.monotonic() + timeout
        result = bytearray()
        while time.monotonic() < deadline:
            waiting = self._waiting(ser)
            if waiting:
                try:
                    result.extend(ser.read(waiting))
                except (SerialException, OSError, termios.error) as error:
                    port = getattr(ser, "port", None) or self.port or "<unknown>"
                    raise LCUS4Error(
                        f"Failed to read LCUS-4 response on {port}: {error}"
                    ) from error
                if stop_when_complete:
                    try:
                        _parse_status_response(result.decode("utf-8", errors="ignore"))
                        break
                    except LCUS4Error:
                        pass
                elif b"\n" in result:
                    break
            else:
                time.sleep(COMMAND_RESPONSE_POLL_INTERVAL_SECONDS)
        return bytes(result)

    def _send_frame(
        self,
        frame: bytes,
        *,
        timeout: float = COMMAND_RESPONSE_TIMEOUT_SECONDS,
        wait_for_response: bool = False,
        response_is_status: bool = False,
    ) -> str:
        """Send one ASCII command frame and return any response text."""
        if not self._ser or not self._ser.is_open:
            raise LCUS4Error(
                f"LCUS-4 device not connected for command {frame.hex(' ')} "
                f"(port={self.port})"
            )

        ser = self._ser
        port = self.port or getattr(ser, "port", None) or "<unknown>"
        self._reset_buffers(ser, port)
        try:
            ser.write(frame)
        except (SerialException, OSError, termios.error) as error:
            raise LCUS4Error(
                f"Failed to write LCUS-4 command {frame.hex(' ')} on {port}: {error}"
            ) from error

        if not wait_for_response:
            # Control frames normally have no response.  Consume bytes already
            # buffered by a firmware variant that sends an acknowledgement.
            response = self._read_response(ser, timeout=0.01)
        else:
            response = self._read_response(
                ser, timeout=timeout, stop_when_complete=response_is_status
            )
        return response.decode("utf-8", errors="ignore").strip()

    def _query_status(self, ser: serial.Serial) -> RelayStatus:
        """Query fan status on a given connection."""
        port = getattr(ser, "port", None) or self.port or "<unknown>"
        self._reset_buffers(ser, port)
        try:
            ser.write(CMD_STATUS)
        except (SerialException, OSError, termios.error) as error:
            raise LCUS4Error(
                f"Failed to query LCUS-4 status on {port}: {error}"
            ) from error
        raw = self._read_response(
            ser, COMMAND_RESPONSE_TIMEOUT_SECONDS, stop_when_complete=True
        )
        response = raw.decode("utf-8", errors="ignore").strip()
        channels = _parse_status_response(response)
        return RelayStatus(channels=dict(channels), raw_response=response)

    def _reopen_serial(self) -> None:
        """Reopen the current port after a transient serial failure."""
        if not self.port:
            return
        previous_port = self.port
        if self._ser:
            try:
                self._ser.close()
            except (OSError, SerialException, termios.error):
                pass
        try:
            self._ser = serial.Serial(
                port=previous_port,
                baudrate=self._baudrate,
                timeout=self._timeout,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
            )
            time.sleep(SERIAL_STARTUP_DELAY_SECONDS)
            self._reset_buffers(self._ser, previous_port)
        except (OSError, SerialException, termios.error) as error:
            self._ser = None
            raise LCUS4Error(
                f"Failed to reopen LCUS-4 serial port {previous_port}: {error}"
            ) from error

    def set_channel(self, channel: int, enabled: bool) -> RelayState:
        """Set the fan state through compatibility channel 1."""
        frame = _command_for_channel(channel, enabled)
        last_error: Optional[Exception] = None
        for attempt in range(SERIAL_COMMAND_RETRIES + 1):
            try:
                response = self._send_frame(frame)
                state = RelayState(
                    channel=channel,
                    enabled=enabled,
                    command=frame,
                    raw_response=response,
                )
                cached = dict(self._last_status.channels) if self._last_status else {}
                cached[channel] = enabled
                if set(cached) == set(CHANNELS):
                    self._last_status = RelayStatus(cached, response)
                return state
            except (LCUS4Error, OSError, SerialException, termios.error) as error:
                last_error = error
                if attempt < SERIAL_COMMAND_RETRIES:
                    self._delay_for_retry(
                        f"Retrying LCUS-4 command {frame.hex(' ')} on "
                        f"{self.port}: {error}"
                    )
                    self._reopen_serial()
        raise LCUS4Error(
            f"Failed to send LCUS-4 command {frame.hex(' ')} on "
            f"{self.port}: {last_error}"
        ) from last_error

    def get_status(self) -> RelayStatus:
        """Read the current fan state from the controller."""
        if not self._ser or not self._ser.is_open:
            raise LCUS4Error(f"LCUS-4 device not connected (port={self.port})")
        last_error: Optional[Exception] = None
        for attempt in range(SERIAL_COMMAND_RETRIES + 1):
            try:
                status = self._query_status(self._ser)
                self._last_status = status
                return status
            except (LCUS4Error, OSError, SerialException, termios.error) as error:
                last_error = error
                if attempt < SERIAL_COMMAND_RETRIES:
                    self._delay_for_retry(
                        f"Retrying LCUS-4 status query on {self.port}: {error}"
                    )
                    self._reopen_serial()
        raise LCUS4Error(
            f"Failed to read LCUS-4 status on {self.port}: {last_error}"
        ) from last_error

    def _delay_for_retry(self, message: str) -> None:
        if self.ctx:
            self.ctx.delay(seconds=SERIAL_RETRY_DELAY_SECONDS, msg=message)
        else:
            time.sleep(SERIAL_RETRY_DELAY_SECONDS)

    def get_version(self) -> str:
        """Query and return the controller firmware version."""
        if not self._ser or not self._ser.is_open:
            raise LCUS4Error(f"LCUS-4 device not connected (port={self.port})")
        response = self._send_frame(
            CMD_VERSION,
            timeout=COMMAND_RESPONSE_TIMEOUT_SECONDS,
            wait_for_response=True,
        )
        if not response:
            raise LCUS4Error("LCUS-4 returned an empty VERSION response")
        return _normalize_version_response(response)

    def get_help(self) -> str:
        """Query and return the controller command help text."""
        if not self._ser or not self._ser.is_open:
            raise LCUS4Error(f"LCUS-4 device not connected (port={self.port})")
        response = self._send_frame(
            CMD_HELP,
            timeout=COMMAND_RESPONSE_TIMEOUT_SECONDS,
            wait_for_response=True,
        )
        if not response:
            raise LCUS4Error("LCUS-4 returned an empty HELP response")
        return response

    def close(self) -> None:
        if self._ser:
            self._ser.close()
            self._ser = None
            ui.print_info(f"{DEVICE_NAME} serial closed")


class LCUS4Simulate(LCUS4Base):
    """In-memory LCUS-4 implementation for protocol development."""

    def __init__(self) -> None:
        self._channels: Dict[int, bool] = {1: False}

    def get_version(self) -> str:
        return "FAN 1.0.0"

    def get_status(self) -> RelayStatus:
        raw = f"STATUS FAN_{'ON' if self._channels[1] else 'OFF'}"
        return RelayStatus(channels=dict(self._channels), raw_response=raw.strip())

    def set_channel(self, channel: int, enabled: bool) -> RelayState:
        _validate_channel(channel)
        self._channels[channel] = enabled
        frame = _command_for_channel(channel, enabled)
        return RelayState(
            channel=channel,
            enabled=enabled,
            command=frame,
            raw_response="OK",
        )

    def close(self) -> None:
        pass


def BuildLCUS4(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: Optional[Sequence[str]] = None,
    ctx=None,
) -> LCUS4Base:
    """Build and connect an LCUS-4 driver."""
    if simulate:
        return LCUS4Simulate()
    device = LCUS4Serial(ctx=ctx)
    if device.connect(autosearch=autosearch, port=port, skip_port=skip_port):
        return device
    raise LCUS4Error("Failed to connect LCUS-4 relay device")


def BuildLCUS4WithPort(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: Optional[Sequence[str]] = None,
    ctx=None,
) -> Tuple[LCUS4Base, Optional[str]]:
    """Build an LCUS-4 driver and return its connected serial port."""
    if simulate:
        return LCUS4Simulate(), None
    device = LCUS4Serial(ctx=ctx)
    if device.connect(autosearch=autosearch, port=port, skip_port=skip_port):
        return device, device.port
    raise LCUS4Error("Failed to connect LCUS-4 relay device")


# Names with an underscore are kept as aliases because the module/file model
# is commonly written as ``LCUS_4`` in test and protocol code.
LCUS_4Base = LCUS4Base
LCUS_4Serial = LCUS4Serial
LCUS_4Simulate = LCUS4Simulate
LCUS_4Error = LCUS4Error
BuildLCUS_4 = BuildLCUS4
BuildLCUS_4WithPort = BuildLCUS4WithPort


if __name__ == "__main__":
    relay = BuildLCUS4()
    print(relay.get_version())
    print(relay.get_status())
    relay.channel_1_on()
    print(relay.get_status())
    relay.close()
