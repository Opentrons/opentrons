"""Impact protection 96ch driver."""

import abc
import logging
import os
import re
import termios
import time
from abc import ABC
from dataclasses import dataclass
from typing import Optional, Tuple
from typing import Sequence

import serial  # type: ignore
from serial.serialutil import SerialException  # type: ignore
from serial.tools.list_ports import comports  # type: ignore

from hardware_testing.data import ui

log = logging.getLogger(__name__)

USB_VID = 0x0483
USB_PID = 0x5740

CMD_GET_VERSION = "M115"
CMD_SET_LEFT_P1000 = "SetLeftP1000"
CMD_SET_LEFT_P200 = "SetLeftP200"
CMD_SET_LEFT_P20 = "SetLeftP20"
CMD_GET_PIPETTE = "GetPipette"
CMD_HOME = "Home"
SERIAL_COMMAND_RETRIES = 1
SERIAL_RETRY_DELAY_SECONDS = 1


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


class ImpactProtection96chError(RuntimeError):
    """Impact protection 96ch device error."""


@dataclass
class PipetteState:
    """Pipette command result."""

    command: str
    raw_response: str


class ImpactProtection96chBase(ABC):
    """Abstract base class for the 96ch impact protection device."""

    @classmethod
    def vid_pid(cls) -> Tuple[Optional[int], Optional[int]]:
        return USB_VID, USB_PID

    @abc.abstractmethod
    def get_version(self) -> str:
        ...

    @abc.abstractmethod
    def set_left_p1000(self) -> PipetteState:
        ...

    @abc.abstractmethod
    def set_left_p200(self) -> PipetteState:
        ...

    @abc.abstractmethod
    def set_left_p20(self) -> PipetteState:
        ...

    @abc.abstractmethod
    def get_pipette(self) -> PipetteState:
        ...

    @abc.abstractmethod
    def home(self) -> PipetteState:
        ...

    @abc.abstractmethod
    def close(self) -> None:
        ...


class ImpactProtection96chSerial(ImpactProtection96chBase):
    """Serial implementation for the 96ch impact protection device."""

    def __init__(self, baudrate: int = 9600, timeout: float = 1.0, ctx=None) -> None:
        self._baudrate = baudrate
        self._timeout = timeout
        self._ser: Optional[serial.Serial] = None
        self.port: Optional[str] = None
        self._skip_ports: list[str] = []
        self._is_home = False
        self.ctx = ctx

    def connect(
        self,
        autosearch: bool = True,
        port: str = "",
        skip_port: Optional[Sequence[str]] = None,
    ) -> bool:
        del autosearch
        skip_ports = list(skip_port or [])
        self._skip_ports = skip_ports
        ports = comports()
        if not ports:
            raise ImpactProtection96chError("No serial ports found")

        for p in ports:
            ser: Optional[serial.Serial] = None
            if port and port not in p.device:
                continue
            if any(sk in p.device for sk in skip_ports):
                continue
            if _port_is_open_in_this_process(p.device):
                log.info("Skipping serial port already in use: %s", p.device)
                continue
            if p.vid != USB_VID or p.pid != USB_PID:
                continue
            if self.ctx:
                self.ctx.delay(seconds=1, msg=f"p {p}")
            try:
                ser = serial.Serial(
                    port=p.device,
                    baudrate=self._baudrate,
                    timeout=self._timeout,
                )
                time.sleep(1)
                ser.flushInput()
                ser.flushOutput()
                resp = self._send_with_serial(
                    ser, CMD_GET_VERSION, timeout=5, wait_for_ok=False
                )
                if "VersionImpact_96ch 0.0.1" in resp:
                    self._ser = ser
                    self.port = p.device
                    return True
                ser.close()
            except (ImpactProtection96chError, OSError, SerialException, termios.error):
                if ser:
                    try:
                        ser.close()
                    except (OSError, SerialException, termios.error):
                        pass
                continue

        raise ImpactProtection96chError("Target ImpactProtection 96ch device not found")

    def _send_with_serial(
        self,
        ser: serial.Serial,
        cmd: str,
        timeout: float = 5,
        wait_for_ok: bool = True,
    ) -> str:
        port = getattr(ser, "port", None) or self.port or "<unknown>"
        try:
            ser.reset_input_buffer()
            ser.reset_output_buffer()
        except (SerialException, OSError, termios.error) as e:
            raise ImpactProtection96chError(
                f"Failed to flush serial buffers on port {port} before command "
                f"{cmd}: {e}"
            ) from e

        try:
            ser.write((cmd.strip()).encode("ascii"))
        except (SerialException, OSError, termios.error) as e:
            raise ImpactProtection96chError(
                f"Failed to write command {cmd} on port {port}: {e}"
            ) from e
        time.sleep(0.5)

        start = time.time()
        buf = ""
        while time.time() - start < timeout:
            try:
                chunk = ser.read(500).decode(errors="ignore")
            except (SerialException, OSError, termios.error) as e:
                raise ImpactProtection96chError(
                    f"Failed to read response for command {cmd} on port {port}: {e}"
                ) from e
            if chunk:
                buf += chunk
                if "Wrong Channel" in buf:
                    break
                if wait_for_ok:
                    if "OK" in buf:
                        break
                else:
                    break
            time.sleep(0.1)
        return buf.strip()

    def _send(self, cmd: str, timeout: float = 5, wait_for_ok: bool = True) -> str:
        if not self._ser or not self._ser.is_open:
            raise ImpactProtection96chError(
                f"Impact 96ch device not connected for command {cmd} "
                f"(port={self.port})"
            )

        last_error: Optional[ImpactProtection96chError] = None
        for attempt in range(SERIAL_COMMAND_RETRIES + 1):
            try:
                resp = self._send_with_serial(
                    self._ser, cmd, timeout=timeout, wait_for_ok=wait_for_ok
                )
                if resp:
                    return resp
                last_error = ImpactProtection96chError(
                    f"No response received for command {cmd} on port {self.port}"
                )
            except (
                ImpactProtection96chError,
                OSError,
                SerialException,
                termios.error,
            ) as e:
                last_error = e

            if attempt < SERIAL_COMMAND_RETRIES:
                self._delay_for_retry(
                    f"Retrying 96ch impact command {cmd} on port {self.port}: "
                    f"{last_error}"
                )
                try:
                    self._reopen_serial()
                except (
                    ImpactProtection96chError,
                    OSError,
                    SerialException,
                    termios.error,
                ) as e:
                    last_error = ImpactProtection96chError(
                        f"Failed to recover 96ch impact serial after command {cmd} "
                        f"on port {self.port}: {e}"
                    )
                    break

        if last_error:
            if isinstance(last_error, ImpactProtection96chError):
                raise last_error
            raise ImpactProtection96chError(
                f"Failed to send 96ch impact command {cmd} on port {self.port}: "
                f"{last_error}"
            ) from last_error
        raise ImpactProtection96chError(
            f"No response received for command {cmd} on port {self.port}"
        )

    def _delay_for_retry(self, msg: str) -> None:
        if self.ctx:
            self.ctx.delay(seconds=SERIAL_RETRY_DELAY_SECONDS, msg=msg)
        else:
            time.sleep(SERIAL_RETRY_DELAY_SECONDS)

    def _log_status(self, msg: str) -> None:
        if self.ctx:
            self.ctx.delay(seconds=0.1, msg=msg)
        else:
            ui.print_info(msg)

    def _reopen_serial(self) -> None:
        if not self.port:
            return

        if self._ser:
            try:
                self._ser.close()
            except (OSError, SerialException, termios.error):
                pass

        previous_port = self.port
        try:
            self._ser = serial.Serial(
                port=self.port,
                baudrate=self._baudrate,
                timeout=self._timeout,
            )
            time.sleep(SERIAL_RETRY_DELAY_SECONDS)
            self._ser.reset_input_buffer()
            self._ser.reset_output_buffer()
        except (OSError, SerialException, termios.error) as e:
            self._delay_for_retry(
                f"Failed to reopen Impact 96ch serial port {previous_port}; "
                "rescanning serial ports for 96ch impact device"
            )
            try:
                self.connect(autosearch=True, port="", skip_port=self._skip_ports)
            except ImpactProtection96chError as reconnect_error:
                raise ImpactProtection96chError(
                    f"Failed to reopen Impact 96ch serial port {previous_port}: {e}; "
                    f"also failed to reconnect by scanning ports: {reconnect_error}"
                ) from reconnect_error

    @staticmethod
    def _expected_pipette_names(cmd: str) -> Tuple[str, ...]:
        expected = {
            CMD_SET_LEFT_P1000: ("P1000",),
            CMD_SET_LEFT_P200: ("P200", "P50"),
            CMD_SET_LEFT_P20: ("P20",),
        }.get(cmd)
        if not expected:
            raise ImpactProtection96chError(f"Unsupported pipette command {cmd}")
        return expected

    @staticmethod
    def _normalize_pipette_response(resp: str) -> str:
        return resp.strip().upper()

    @staticmethod
    def _pipette_from_get_response(resp: str) -> Optional[str]:
        normalized = ImpactProtection96chSerial._normalize_pipette_response(resp)
        match = re.fullmatch(
            r"GETPI(?:EP|PE)TTE\s*=\s*(P20|P50|P200|P1000)",
            normalized,
        )
        if not match:
            return None
        return match.group(1)

    def _set_pipette(self, cmd: str) -> PipetteState:
        expected = self._expected_pipette_names(cmd)
        current = self.get_pipette()
        current_pipette = self._pipette_from_get_response(current.raw_response)
        self._log_status(
            f"96ch impact current pipette: expected={'/'.join(expected)}, "
            f"parsed={current_pipette}, raw={current.raw_response}"
        )
        if current_pipette in expected:
            self._is_home = False
            return PipetteState(
                command=cmd,
                raw_response=f"OK_ALREADY_{current_pipette}:{current.raw_response}",
            )
        resp = self._send(cmd, timeout=5, wait_for_ok=True)
        if "OK" in resp:
            self._is_home = False
        return PipetteState(command=cmd, raw_response=resp)

    def get_version(self) -> str:
        return self._send(CMD_GET_VERSION, timeout=5, wait_for_ok=False)

    def set_left_p1000(self) -> PipetteState:
        return self._set_pipette(CMD_SET_LEFT_P1000)

    def set_left_p200(self) -> PipetteState:
        return self._set_pipette(CMD_SET_LEFT_P200)

    def set_left_p20(self) -> PipetteState:
        return self._set_pipette(CMD_SET_LEFT_P20)

    def get_pipette(self) -> PipetteState:
        resp = self._send(CMD_GET_PIPETTE, timeout=5, wait_for_ok=False)
        return PipetteState(command=CMD_GET_PIPETTE, raw_response=resp)

    def home(self) -> PipetteState:
        if self._is_home:
            return PipetteState(command=CMD_HOME, raw_response="OK_ALREADY_HOME")
        resp = self._send(CMD_HOME, timeout=5, wait_for_ok=True)
        if "OK" in resp:
            self._is_home = True
        return PipetteState(command=CMD_HOME, raw_response=resp)

    def close(self) -> None:
        if self._ser:
            self._ser.close()
            ui.print_info("ImpactProtection 96ch serial closed")


class ImpactProtection96chSimulate(ImpactProtection96chBase):
    """Simulation implementation."""

    def __init__(self) -> None:
        self._current_pipette = "UNKNOWN"

    @staticmethod
    def _expected_pipette_name(cmd: str) -> str:
        expected = {
            CMD_SET_LEFT_P1000: "P1000",
            CMD_SET_LEFT_P200: "P200",
            CMD_SET_LEFT_P20: "P20",
        }.get(cmd)
        if not expected:
            raise ImpactProtection96chError(f"Unsupported pipette command {cmd}")
        return expected

    def get_version(self) -> str:
        return "SIM-ImpactProtection96ch v1.0"

    def set_left_p1000(self) -> PipetteState:
        expected = self._expected_pipette_name(CMD_SET_LEFT_P1000)
        if self._current_pipette == expected:
            return PipetteState(
                command=CMD_SET_LEFT_P1000,
                raw_response=f"SIM_OK_ALREADY_{expected}",
            )
        self._current_pipette = expected
        return PipetteState(command=CMD_SET_LEFT_P1000, raw_response="SIM_OK")

    def set_left_p200(self) -> PipetteState:
        expected = self._expected_pipette_name(CMD_SET_LEFT_P200)
        if self._current_pipette == expected:
            return PipetteState(
                command=CMD_SET_LEFT_P200,
                raw_response=f"SIM_OK_ALREADY_{expected}",
            )
        self._current_pipette = expected
        return PipetteState(command=CMD_SET_LEFT_P200, raw_response="SIM_OK")

    def set_left_p20(self) -> PipetteState:
        expected = self._expected_pipette_name(CMD_SET_LEFT_P20)
        if self._current_pipette == expected:
            return PipetteState(
                command=CMD_SET_LEFT_P20,
                raw_response=f"SIM_OK_ALREADY_{expected}",
            )
        self._current_pipette = expected
        return PipetteState(command=CMD_SET_LEFT_P20, raw_response="SIM_OK")

    def get_pipette(self) -> PipetteState:
        return PipetteState(
            command=CMD_GET_PIPETTE, raw_response=f"SIM_{self._current_pipette}"
        )

    def home(self) -> PipetteState:
        if self._current_pipette == "HOME":
            return PipetteState(command=CMD_HOME, raw_response="SIM_OK_ALREADY_HOME")
        self._current_pipette = "HOME"
        return PipetteState(command=CMD_HOME, raw_response="HOME = OK")

    def close(self) -> None:
        pass




def BuildImpactProtection96ch(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: Optional[Sequence[str]] = None,
    ctx=None,
) -> ImpactProtection96chBase:
    """Build a 96ch impact protection device."""
    if simulate:
        return ImpactProtection96chSimulate()

    dev = ImpactProtection96chSerial(ctx=ctx)
    conret = dev.connect(autosearch=autosearch, port=port, skip_port=skip_port)
    if conret:
        return dev
    raise ImpactProtection96chError("Failed to connect ImpactProtection 96ch device")


def BuildImpactProtection96chWithPort(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: Optional[Sequence[str]] = None,
    ctx=None,
) -> Tuple[ImpactProtection96chBase, Optional[str]]:
    """Build a 96ch impact protection device and return its connected port."""
    if simulate:
        return ImpactProtection96chSimulate(), None

    dev = ImpactProtection96chSerial(ctx=ctx)
    conret = dev.connect(autosearch=autosearch, port=port, skip_port=skip_port)
    if conret:
        return dev, dev.port
    raise ImpactProtection96chError("Failed to connect ImpactProtection 96ch device")


if __name__ == "__main__":
    dev = BuildImpactProtection96ch()
    print(dev.get_version())
    print(dev.home().raw_response)
    print(dev.set_left_p1000().raw_response)
    # print(dev.get_pipette().raw_response)
    # print(dev.set_left_p200().raw_response)
    # print(dev.get_pipette().raw_response)
    # print(dev.set_left_p20().raw_response)
    print(dev.get_pipette().raw_response)
