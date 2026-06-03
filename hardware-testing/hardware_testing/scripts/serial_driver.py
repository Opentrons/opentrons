"""Prototyping driver to talk over serial to a device."""
# encoding:utf-8

import time
from typing import Union, Optional, List, Any
import serial  # type: ignore [import-untyped]
import serial.tools.list_ports  # type: ignore [import-untyped]

ReceiveBuffer = 500


class SerialDriver:
    """Generic serial device driver."""

    @classmethod
    def get_com_list(cls) -> List[Any]:
        """Get ports on the system."""
        port_list = serial.tools.list_ports.comports()
        return port_list

    def __init__(self) -> None:
        """Init."""
        self.device: Optional[str] = None
        self.com: Optional[serial.Serial] = None
        self.receive_buffer: Optional[int] = None

    def get_device(self, select_default: str = "", device_name: str = "") -> None:
        """Prompt user to select device."""
        if select_default != "":
            self.device = select_default
        else:
            port_list = SerialDriver.get_com_list()
            print("=" * 5 + "PORT LIST" + "=" * 5)
            for index, p in enumerate(port_list):
                print(f"{index + 1} >>{p.device}")
            select = input(f"Select Port Number(输入串口号对应的数字) -- {device_name}:")
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
        assert self.com, "Init serial failed"
        if self.com.isOpen():
            print(f"{self.device} Opened! \n")
        # settings
        self.com.bytesize = serial.EIGHTBITS  # 数据位 8
        self.com.parity = serial.PARITY_NONE  # 无校验
        self.com.stopbits = serial.STOPBITS_ONE  # 停止位 1

    def close(self) -> None:
        """Close com."""
        if self.com is None:
            return
        assert self.com is not None
        self.com.close()
        print(f"{self.device} Closed! \n")

    def init(self, baud: int, select_default: str = "", device_name: str = "") -> None:
        """Build a connection."""
        self.get_device(select_default=select_default, device_name=device_name)
        try:
            self.init_serial(baud)
        except Exception as e:
            print(f"Can't find device {e}")

    def write_and_get_buffer(
        self,
        send: Union[str, bytes],
        only_write: bool = False,
        delay: Optional[float] = None,
        times: int = 30,
    ) -> Optional[Union[str, bytes]]:
        """Send cmd and return result."""
        if self.com is None:
            return None
        assert self.com is not None
        if isinstance(send, str):
            send = (send + "\r\n").encode("utf-8")
        self.com.flushInput()
        self.com.flushOutput()
        self.com.write(send)
        time.sleep(0.1)
        if delay is None:
            pass
        else:
            time.sleep(delay)
        if only_write is True:
            return None
        for i in range(times):
            data = self.com.read(ReceiveBuffer)
            if type(data) is not bytes:
                if "OK" not in data.decode("utf-8") or "busy" in data.decode("utf-8"):
                    time.sleep(1)
                    continue
            else:
                return data
            return data.decode("utf-8")
        return None

    def read_buffer(self) -> str:
        """Read a buffer.

        读取缓存
        """
        assert self.com is not None
        try:
            self.com.flushInput()
            self.com.flushOutput()
        except Exception as e:
            print(f"err flusing {e}")
            pass
        time.sleep(0.3)
        # length = self.com.inWaiting()
        length = ReceiveBuffer if self.receive_buffer is None else self.receive_buffer
        data = self.com.read(length)
        self.com.flushInput()
        self.com.flushOutput()
        return data.decode("utf-8")

    def read_buffer2(self, read_length: int, hex_flag: bool = False) -> Optional[str]:
        """Get specific length of buffer."""
        if self.com is None:
            return None
        assert self.com is not None
        self.com.flushInput()  # 清除接收缓存数据
        for _i in range(5):
            time.sleep(0.1)
            length = self.com.in_waiting
            if length < read_length:
                continue
            else:
                return (
                    self.com.read(read_length)
                    if not hex_flag
                    else self.com.read(read_length).hex()
                )
        return None


if __name__ == "__main__":
    s = SerialDriver()
    s.init(115200)
    s.write_and_get_buffer("M115")
