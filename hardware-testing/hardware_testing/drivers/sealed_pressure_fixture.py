"""Sealed pressure sensor fixture."""
# encoding:utf-8

import time
from typing import Union, Optional, Any, List
import serial  # type: ignore[import-untyped]
from serial.tools.list_ports import comports  # type: ignore[import-untyped]

ReceiveBuffer = 100


class SerialDriver:
    """Driver for serially connected pressure sensor."""

    @classmethod
    def get_com_list(cls) -> List[Any]:
        """List serial ports."""
        port_list = comports()
        return port_list

    def __init__(self) -> None:
        """Init for driver."""
        self.device: Any = None
        self.com: Optional[serial.Serial] = None

    def get_device(self) -> None:
        """Select device."""
        port_list = SerialDriver.get_com_list()
        print("=" * 5 + "PORT LIST" + "=" * 5)
        for index, p in enumerate(port_list):
            print(f"{index + 1} >>{p.device}")
        select = input("Select Port Number(输入串口号对应的数字):")
        self.device = port_list[int(select.strip()) - 1].device

    def init_serial(self, baud: int) -> None:
        """Init connection."""
        self.com = serial.Serial(
            self.device,
            baud,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            bytesize=serial.EIGHTBITS,
            timeout=1,
        )
        if self.com.isOpen():
            print(f"{self.device} Opened! \n")
        # settings
        self.com.bytesize = serial.EIGHTBITS  # 数据位 8
        self.com.parity = serial.PARITY_NONE  # 无校验
        self.com.stopbits = serial.STOPBITS_ONE  # 停止位 1

    def close(self) -> None:
        """Close com."""
        if self.com is not None:
            self.com.close()
            print(f"{self.device} Closed! \n")

    def init(self, baud: int) -> None:
        """Connect to device."""
        self.get_device()
        try:
            self.init_serial(baud)
        except Exception as e:
            print(f"Can't find device: {e}")

    def write_and_get_buffer(
        self,
        send: Union[str, int, bytes],
        only_write: bool = False,
        delay: Optional[float] = None,
        times: int = 30,
    ) -> Optional[str]:
        """Send command."""
        if self.com is None:
            return None
        if not isinstance(send, bytes):
            send = (str(send) + "\r\n").encode("utf-8")
        self.com.flushInput()  # type: ignore [union-attr]
        self.com.flushOutput()  # type: ignore [union-attr]
        self.com.write(send)  # type: ignore [union-attr]
        time.sleep(0.1)
        if delay is None:
            pass
        else:
            time.sleep(delay)
        if only_write is True:
            return None
        for i in range(times):
            data = self.com.read(ReceiveBuffer)  # type: ignore [union-attr]
            if type(data) is not bytes:
                if "OK" not in data.decode("utf-8") or "busy" in data.decode("utf-8"):
                    time.sleep(1)
                    continue
            else:
                return data.decode("utf-8")
        return None

    def read_buffer(self) -> str:
        """Read from device. 读取缓存."""
        try:
            self.com.flushInput()  # type: ignore [union-attr]
            self.com.flushOutput()  # type: ignore [union-attr]
        except Exception as e:
            print(f"error reading serial: {e}")
            pass
        time.sleep(3)
        length = ReceiveBuffer
        data = self.com.read(length)  # type: ignore [union-attr]
        self.com.flushInput()  # type: ignore [union-attr]
        self.com.flushOutput()  # type: ignore [union-attr]
        return data.decode("utf-8")

    def get_pressure(self) -> Optional[float]:
        """Read pressure value."""
        for _i in range(5):
            try:
                respond = self.read_buffer()
                respond_list = respond.split("|")
                respond_value = respond_list[1]

                return float(respond_value.split("\r\n")[0].split("\t")[1].strip())
            except Exception as e:
                print(f"get pressure fail at {_i} times: {e}")
                pass
        return None


if __name__ == "__main__":
    s = SerialDriver()
    s.init(9600)
    for i in range(100):
        result = s.get_pressure()
        print(result)
