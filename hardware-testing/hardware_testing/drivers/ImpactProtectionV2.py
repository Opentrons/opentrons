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
    def _send(self, cmd: str, timeout=5) -> str:
        if not self._ser or not self._ser.is_open:
            raise ImpactProtectionError("Impact device not connected")

        ser = self._ser
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        # 打印发送的命令
        #.delay(seconds=0.2, msg=f"send- {cmd}")

        ser.write((cmd.strip() + "\r\n").encode("ascii"))

        # 增加发送后的延迟，给设备更多时间响应
        time.sleep(0.5)

        start = time.time()
        buf = ""

        while time.time() - start < timeout:
            # 即使 in_waiting 为 0，也尝试读取一些数据
            # 这可以捕获设备在延迟后发送的数据
            chunk = ser.read(500).decode(errors="ignore")
            if chunk:
                buf += chunk
                #self.ctx.delay(seconds=0.2, msg=f"data- {chunk}")

                # 先判断错误
                if "Wrong Channel" in buf:
                    break

                # 再判断成功
                if "OK" in buf:
                    break

            # 短暂休眠，避免占用过多 CPU
            time.sleep(0.1)

        return buf.strip()

    # ---------- protocol ----------
    def get_version(self) -> str:
        return self._send("M115")

    def switch_mode(self, mode: str) -> ImpactState:
        resp = self._send(mode)
        return ImpactState(mode=mode, raw_response=resp)

    def close_all_gratings(self) -> ImpactState:
        resp = self._send("M18")
        return ImpactState(mode="CLOSE_ALL", raw_response=resp)

    def close(self) -> None:
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
