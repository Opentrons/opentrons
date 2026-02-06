"""
Impact protection (collision avoidance) driver.

Based on Asair sensor driver architecture.
"""

import abc
import time
import logging
from abc import ABC
from dataclasses import dataclass
from typing import Tuple, Optional

import serial  # type: ignore
from serial.serialutil import SerialException  # type: ignore
from serial.tools.list_ports import comports  # type: ignore
from . import list_ports_and_select
from hardware_testing.data import ui

log = logging.getLogger(__name__)

USB_VID = None     # 如果有固定 VID / PID 可填写
USB_PID = None


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
    def get_version(self) -> bool:
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
    def __init__(self, connection: serial.Serial, baudrate: int = 115200, timeout: float = 1.0,ctx=None) -> None:
        self._baudrate = baudrate
        self._timeout = timeout
        self._ser = connection
        self.ctx = ctx
        

    # ---------- connection ----------
    @classmethod
    def connect_v2(cls, port: str,
        baudrate: int = 115200,
        timeout: float = 5,
        ctx=None
        ) -> "ImpactProtectionSerial":
        try:
            connection = serial.Serial(
                port=port,
                baudrate=baudrate,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=timeout,
            )
            return cls(connection,ctx=ctx)
        except SerialException:
            error_msg = (
                "Unable to access Serial port to Scale: \n"
                "1. Check that the scale is plugged into the computer. \n"
                "2. Check if the assigned port is correct. \n"
            )
            raise SerialException(error_msg)


    
    # ---------- protocol ----------
    def get_version(self) -> bool:
        try:
            self._ser.flushInput()
            self._ser.flushOutput()
            send =(str("M115") + "\r\n").encode('utf-8')
            self._ser.write(send)
            time.sleep(1)
            resp1 = ''
            for i in range(4):
                resp = self._ser.read(500)
                self.ctx.delay(seconds=1,msg=f"resp------- {resp}")
                if resp:
                    resp1 = resp.decode('utf-8', errors='ignore')
                    print(resp1)
                    if "Wrong Channel" in resp1:
                        send =(str("M115") + "\r\n").encode('utf-8')
                        self._ser.write(send)
                        time.sleep(1)
                    else:
                        break


                self.ctx.delay(seconds=1,msg=f"reesp {resp1}")
                #resp = ser.readline().decode(errors="ignore").strip()
                #self.ctx.delay(seconds= 0.1,msg=f"resp {resp} {type(resp)}")
                #print(resp)
                time.sleep(0.5)
            try:    
                if "VersionImpact" in resp1:
                    return True
            except Exception as err:
                self.ctx.delay(seconds=1,msg=f"err {err}")
            return False
        except:
            return False
    def _send(self, cmd: str, timeout=5) -> str:
        if not self._ser or not self._ser.is_open:
            raise ImpactProtectionError("Impact device not connected")
        self._ser.reset_input_buffer()
        self._ser.reset_output_buffer()

        # 打印发送的命令
        self.ctx.delay(seconds=0.2, msg=f"send- {cmd}")
        
        self._ser.write((cmd.strip() + "\r\n").encode("ascii"))
        
        # 增加发送后的延迟，给设备更多时间响应
        time.sleep(0.5)

        start = time.time()
        buf = ""

        while time.time() - start < timeout:
            # 即使 in_waiting 为 0，也尝试读取一些数据
            # 这可以捕获设备在延迟后发送的数据
            chunk = self._ser.read(500).decode(errors="ignore")
            if chunk:
                buf += chunk
                self.ctx.delay(seconds=0.2, msg=f"data- {chunk}")

                # 先判断错误
                if "Wrong Channel" in buf:
                    break

                # 再判断成功
                if "OK" in buf:
                    break
            
            # 短暂休眠，避免占用过多 CPU
            time.sleep(0.1)

        return buf.strip()

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
    def get_version(self) -> bool:
        return True

    def switch_mode(self, mode: str) -> ImpactState:
        return ImpactState(mode=mode, raw_response="SIM_OK")

    def close_all_gratings(self) -> ImpactState:
        return ImpactState(mode="CLOSE_ALL", raw_response="SIM_OK")

    def close(self) -> None:
        pass


def _is_protocol_environment() -> bool:
    try:
        import opentrons.protocol_api  # noqa
        return True
    except Exception:
        return False

def BuildImpactProtection(
    simulate: bool = False,
    autosearch: bool = True,
    port: str = "",
    ctx = None,
    port_substr: str = ""
) -> ImpactProtectionBase:
    if not simulate:
        if not autosearch:
            port = list_ports_and_select(
                device_name="Asair environmental sensor", port_substr=port_substr
            )
            sensor = ImpactProtectionSerial.connect_v2(port)
            return sensor
        else:
            ports = comports()
            assert ports
            for _port in ports:
                port = _port.device  # type: ignore[attr-defined]
                try:
                    sensor = ImpactProtectionSerial.connect_v2(port,ctx=ctx)
                    versiontool = sensor.get_version()
                    if versiontool:
                        return sensor
                    sensor._ser.close()  # 👈 防泄漏
                
                except:  # noqa: E722
                    pass
            use_sim = ui.get_user_answer("No env sensor found, use simulator?")
            if not use_sim:
                raise SerialException("No sensor found")
    return ImpactProtectionSimulate()


if __name__ == "__main__":
    aaa=BuildImpactProtection()
    #aaa.connect()
    # print(aaa.get_version())
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
