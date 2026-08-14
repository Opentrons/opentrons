"""
Impact protection (collision avoidance) driver.

Based on Asair sensor driver architecture.
"""

import abc
import os
import time
import logging
from abc import ABC
from dataclasses import dataclass
from typing import Tuple, Optional

import serial  # type: ignore
from serial.serialutil import SerialException  # type: ignore
from serial.tools.list_ports import comports  # type: ignore

from hardware_testing.data import ui

log = logging.getLogger(__name__)

USB_VID = None     # 如果有固定 VID / PID 可填写
USB_PID = None
COMMAND_RESPONSE_TIMEOUT_SECONDS = 5.0
COMMAND_RESPONSE_POLL_INTERVAL_SECONDS = 0.01
STATE_COMMAND_CACHE_SECONDS = 30.0


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


# =========================
# Error
# =========================
class ImpactProtectionError(RuntimeError):
    """Impact protection device error."""


# =========================
# Data model
# =========================
@dataclass
class ImpactState:
    """Impact protection state."""
    mode: str
    raw_response: str
    command_sent: bool = True


# =========================
# Base class
# =========================
class ImpactProtectionBase(ABC):
    """Abstract base class for Impact protection device."""

    @classmethod
    def vid_pid(cls) -> Tuple[Optional[int], Optional[int]]:
        return USB_VID, USB_PID

    @abc.abstractmethod
    def get_version(self) -> str:
        ...

    @abc.abstractmethod
    def switch_mode(self, mode: str) -> ImpactState:
        ...

    @abc.abstractmethod
    def close_all_gratings(self) -> ImpactState:
        ...

    @abc.abstractmethod
    def close(self) -> None:
        ...


# =========================
# Serial implementation
# =========================
class ImpactProtectionSerial(ImpactProtectionBase):
    def __init__(self, baudrate: int = 115200, timeout: float = 1.0,ctx=None) -> None:
        self._baudrate = baudrate
        self._timeout = timeout
        self._ser: Optional[serial.Serial] = None
        self.port: Optional[str] = None
        self.ctx = ctx
        self._last_successful_command: Optional[str] = None
        self._last_successful_command_at: Optional[float] = None


    # ---------- connection ----------
    def connect(
        self, autosearch: bool = True, port: str = "", skip_port: str = ""
    ) -> bool:
        del autosearch
        ports = comports()
        if not ports:
            raise ImpactProtectionError("No serial ports found")

        for p in ports:
            print(p)
            if port and port not in p.device:
                continue
            elif skip_port and skip_port in p.device:
                continue
            elif _port_is_open_in_this_process(p.device):
                log.info("Skipping serial port already in use: %s", p.device)
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
                #ser.reset_input_buffer()
                ser.flushInput()
                ser.flushOutput()
                send =(str("M115") + "\r\n").encode('utf-8')
                ser.write(send)
                time.sleep(1)
                resp1 = ''
                for i in range(4):
                    resp = ser.read(500)
                    #self.ctx.delay(seconds=1,msg=f"resp------- {resp}")
                    if resp:
                        resp1 = resp.decode('utf-8', errors='ignore')
                        if "Wrong Channel" in resp1:
                            send =(str("M115") + "\r\n").encode('utf-8')
                            ser.write(send)
                            time.sleep(1)
                        else:
                            break


                    #self.ctx.delay(seconds=1,msg=f"reesp {resp1}")
                    #resp = ser.readline().decode(errors="ignore").strip()
                    #self.ctx.delay(seconds= 0.1,msg=f"resp {resp} {type(resp)}")
                    #print(resp)
                if "VersionImpact 0.0.1" in resp1:
                    self._ser = ser
                    self.port = p.device
                    self._last_successful_command = None
                    self._last_successful_command_at = None
                    return True

                ser.close()

            except SerialException:
                continue

        raise ImpactProtectionError("Target ImpactProtection device not found")

    # ---------- low-level ----------
    # def _send(self, cmd: str) -> str:
    #     if not self._ser or not self._ser.is_open:
    #         raise ImpactProtectionError("Impact device not connected")
    #     self._ser.flushInput()
    #     self._ser.flushOutput()
    #     self.ctx.delay(seconds=1,msg=f"cmd- {cmd}")
    #     self._ser.write((cmd.strip() + "\r\n").encode())
    #     time.sleep(1)
    #     data1 = ''
    #     for i in range(30):
    #         data = self._ser.read(1000)

    #         data1 = data.decode('utf-8')
    #         self.ctx.delay(seconds=1,msg=f"data- {data1}")
    #         if "OK" not in data1:
    #             time.sleep(1)
    #             continue
    #         elif "Wrong Channel" in data1:
    #             break
    #     return data1
    def _send(
        self, cmd: str, timeout: float = COMMAND_RESPONSE_TIMEOUT_SECONDS
    ) -> str:
        if not self._ser or not self._ser.is_open:
            raise ImpactProtectionError("Impact device not connected")

        ser = self._ser
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        ser.write((cmd.strip() + "\r\n").encode("ascii"))

        # Read only buffered bytes so Serial.timeout does not delay every command.
        deadline = time.monotonic() + timeout
        buf = ""

        while time.monotonic() < deadline:
            waiting = ser.in_waiting
            if waiting:
                buf += ser.read(waiting).decode(errors="ignore")
                if "Wrong Channel" in buf or "OK" in buf:
                    break
            else:
                time.sleep(COMMAND_RESPONSE_POLL_INTERVAL_SECONDS)

        return buf.strip()

    # ---------- protocol ----------
    def get_version(self) -> str:
        return self._send("M115")

    def _send_state_command(self, command: str, mode: str) -> ImpactState:
        now = time.monotonic()
        if (
            command == self._last_successful_command
            and self._last_successful_command_at is not None
            and now - self._last_successful_command_at <= STATE_COMMAND_CACHE_SECONDS
        ):
            return ImpactState(
                mode=mode,
                raw_response=f"{command} OK (cached)",
                command_sent=False,
            )

        resp = self._send(command)
        if "OK" in resp and "Wrong Channel" not in resp:
            self._last_successful_command = command
            self._last_successful_command_at = time.monotonic()
        else:
            self._last_successful_command = None
            self._last_successful_command_at = None
        return ImpactState(mode=mode, raw_response=resp)

    def switch_mode(self, mode: str) -> ImpactState:
        command = mode.strip()
        return self._send_state_command(command, command)

    def close_all_gratings(self) -> ImpactState:
        return self._send_state_command("M18", "CLOSE_ALL")

    def close(self) -> None:
        self._last_successful_command = None
        self._last_successful_command_at = None
        if self._ser:
            self._ser.close()
            ui.print_info("Impact serial closed")


# =========================
# Factory
# =========================
# def BuildImpactProtection(
#     simulate: bool = False,
#     autosearch: bool = True,
#     port: str = "",
#     ctx = None
# ) -> ImpactProtectionBase:
#     """
#     Build ImpactProtection device.
#     """
#     if not simulate:
#         dev = ImpactProtectionSerial()
#         dev.connect(autosearch=autosearch, port=port)
#         return dev
class ImpactProtectionSimulate(ImpactProtectionBase):
    def get_version(self) -> str:
        return "SIM-ImpactProtection v1.0"

    def switch_mode(self, mode: str) -> ImpactState:
        return ImpactState(mode=mode, raw_response="SIM_OK")

    def close_all_gratings(self) -> ImpactState:
        return ImpactState(mode="CLOSE_ALL", raw_response="SIM_OK")

    def close(self) -> None:
        pass



def BuildImpactProtection(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: str = '',
    ctx = None
) -> ImpactProtectionBase:
    if simulate:
        return ImpactProtectionSimulate()

    dev = ImpactProtectionSerial(ctx=ctx)
    conret = dev.connect(autosearch=autosearch, port=port,skip_port=skip_port)
    if conret:
        return dev
    else:
        return False


def BuildImpactProtectionWithPort(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    skip_port: str = "",
    ctx=None,
) -> Tuple[ImpactProtectionBase, Optional[str]]:
    """Build an ImpactProtection device and return its connected port."""
    if simulate:
        return ImpactProtectionSimulate(), None

    dev = ImpactProtectionSerial(ctx=ctx)
    conret = dev.connect(autosearch=autosearch, port=port, skip_port=skip_port)
    if conret:
        return dev, dev.port
    raise ImpactProtectionError("Failed to connect ImpactProtection device")



if __name__ == "__main__":
    aaa=BuildImpactProtection()
    ttttt=input("输入延时时间:")
    #aaa.connect()
    # print(aaa.get_version())
    time.sleep(int(ttttt))
    print(aaa.switch_mode("M19").raw_response)
    print(aaa.switch_mode("SET_LEFT_T1000").raw_response)
    print(aaa.switch_mode("SET_LEFT_T200").raw_response)
    print(aaa.switch_mode("SET_LEFT_T50").raw_response)
    print(aaa.switch_mode("SET_LEFT_T20").raw_response)

    print(aaa.switch_mode("SET_RIGHT_T1000").raw_response)
    print(aaa.switch_mode("SET_RIGHT_T200").raw_response)
    print(aaa.switch_mode("SET_RIGHT_T50").raw_response)
    print(aaa.switch_mode("SET_RIGHT_T20").raw_response)
    print(aaa.switch_mode("M18").raw_response)
