"""Impact protection 96ch driver."""

import abc
import logging
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

USB_VID = None
USB_PID = None

CMD_GET_VERSION = "M115"
CMD_SET_LEFT_P1000 = "SetLeftP1000"
CMD_SET_LEFT_P200 = "SetLeftP200"
CMD_SET_LEFT_P20 = "SetLeftP20"
CMD_GET_PIPETTE = "GetPipette"


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
    def close(self) -> None:
        ...


class ImpactProtection96chSerial(ImpactProtection96chBase):
    """Serial implementation for the 96ch impact protection device."""

    def __init__(self, baudrate: int = 9600, timeout: float = 1.0, ctx=None) -> None:
        self._baudrate = baudrate
        self._timeout = timeout
        self._ser: Optional[serial.Serial] = None
        self.port: Optional[str] = None
        self.ctx = ctx

    def connect(
        self,
        autosearch: bool = True,
        port: str = "",
        skip_port: Optional[Sequence[str]] = None,
    ) -> bool:
        del autosearch
        skip_ports = list(skip_port or [])
        ports = comports()
        print(ports)
        if not ports:
            raise ImpactProtection96chError("No serial ports found")

        for p in ports:
            if port and port not in p.device:
                continue
            if any(sk in p.device for sk in skip_ports):
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
                resp = self._send_with_serial(ser, CMD_GET_VERSION, timeout=5, wait_for_ok=False)
                print(f"version:{resp}")
                if "VersionImpact_96ch 0.0.1" in resp:
                    self._ser = ser
                    self.port = p.device
                    return True
                ser.close()
            except SerialException:
                continue

        raise ImpactProtection96chError("Target ImpactProtection 96ch device not found")

    def _send_with_serial(
        self,
        ser: serial.Serial,
        cmd: str,
        timeout: float = 5,
        wait_for_ok: bool = True,
    ) -> str:
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        ser.write((cmd.strip()).encode("ascii"))
        time.sleep(0.5)

        start = time.time()
        buf = ""
        while time.time() - start < timeout:
            chunk = ser.read(500).decode(errors="ignore")
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
            raise ImpactProtection96chError("Impact device not connected")

        resp = self._send_with_serial(
            self._ser, cmd, timeout=timeout, wait_for_ok=wait_for_ok
        )
        if not resp:
            raise ImpactProtection96chError(f"No response received for command {cmd}")
        return resp

    def _set_pipette(self, cmd: str) -> PipetteState:
        resp = self._send(cmd, timeout=5, wait_for_ok=True)
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

    def close(self) -> None:
        if self._ser:
            self._ser.close()
            ui.print_info("ImpactProtection 96ch serial closed")


class ImpactProtection96chSimulate(ImpactProtection96chBase):
    """Simulation implementation."""

    def __init__(self) -> None:
        self._current_pipette = "UNKNOWN"

    def get_version(self) -> str:
        return "SIM-ImpactProtection96ch v1.0"

    def set_left_p1000(self) -> PipetteState:
        self._current_pipette = "P1000"
        return PipetteState(command=CMD_SET_LEFT_P1000, raw_response="SIM_OK")

    def set_left_p200(self) -> PipetteState:
        self._current_pipette = "P200"
        return PipetteState(command=CMD_SET_LEFT_P200, raw_response="SIM_OK")

    def set_left_p20(self) -> PipetteState:
        self._current_pipette = "P20"
        return PipetteState(command=CMD_SET_LEFT_P20, raw_response="SIM_OK")

    def get_pipette(self) -> PipetteState:
        return PipetteState(
            command=CMD_GET_PIPETTE, raw_response=f"SIM_{self._current_pipette}"
        )

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
    print(dev.set_left_p1000().raw_response)
    # print(dev.get_pipette().raw_response)
    # print(dev.set_left_p200().raw_response)
    # print(dev.get_pipette().raw_response)
    # print(dev.set_left_p20().raw_response)
    print(dev.get_pipette().raw_response)
