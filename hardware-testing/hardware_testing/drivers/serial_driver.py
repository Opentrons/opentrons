# encoding:utf-8

import time
from typing import Union
import serial
import serial.tools.list_ports

ReceiveBuffer = 500


class SerialDriver:

    @classmethod
    def get_com_list(cls):
        port_list = serial.tools.list_ports.comports()
        return port_list

    def __init__(self):
        self.device = None
        self.com = None
        self.receive_buffer = None

    def get_device(self, select_default=False, lable=""):
        """
        select device
        :return:
        """
        port_list = SerialDriver.get_com_list()
        print("=" * 5 + "PORT LIST" + "=" * 5)
        for index, p in enumerate(port_list):
            print(f"{index + 1} >>{p.device}")
        if select_default:
            select = '1'
        else:
            select = input(f"Select {lable} Port Number(输入串口号对应的数字):")
        self.com = port_list[int(select.strip()) - 1].device

    def init_serial(self, baud):

        """
        init connection
        :param baud:
        :return:
        """
        self.device = serial.Serial(self.com, baud, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE,
                                 bytesize=serial.EIGHTBITS, timeout=1)
        if self.device.isOpen():
            print(f"{self.com} Opened! \n")
        # settings
        self.device.bytesize = serial.EIGHTBITS  # 数据位 8
        self.device.parity = serial.PARITY_NONE  # 无校验
        self.device.stopbits = serial.STOPBITS_ONE  # 停止位 1

    def close(self):
        """
        close com
        :return:
        """
        self.device.close()
        print(f"{self.device} Closed! \n")

    def init(self, baud, select_default=False, lable=""):
        """
        main
        :return:
        """
        self.get_device(select_default=select_default, lable=lable)
        try:
            self.init_serial(baud)
        except:
            print("Can't find device")

    def write_and_get_buffer(self, send: Union[str, int, bytes], only_write=False, delay=None, times=30):
        """
        send cmd
        :return:
        """
        if self.device is None:
            return
        if type(send) is not bytes:
            send = (send + "\r\n").encode('utf-8')
        self.device.flushInput()
        self.device.flushOutput()
        self.device.write(send)
        time.sleep(0.1)
        if delay is None:
            pass
        else:
            time.sleep(delay)
        if only_write is True:
            return
        for i in range(times):
            data = self.device.read(ReceiveBuffer)
            if type(data) is not bytes:
                if "OK" not in data.decode('utf-8') or "busy" in data.decode('utf-8'):
                    time.sleep(1)
                    continue
            else:
                return data
            return data.decode('utf-8')

    def read_buffer(self):
        """
        读取缓存
        :return:
        """
        try:
            self.device.flushInput()
            self.device.flushOutput()
        except:
            pass
        time.sleep(0.3)
        # length = self.com.inWaiting()
        length = ReceiveBuffer if self.receive_buffer is None else self.receive_buffer
        data = self.device.read(length)
        self.device.flushInput()
        self.device.flushOutput()
        return data.decode('utf-8')

    def read_buffer2(self, read_length, hex_flag=None):
        """
        get specify length of buffer
        """
        self.device.flushInput()  # 清除接收缓存数据
        for _i in range(5):
            time.sleep(0.1)
            length = self.device.in_waiting
            if length < read_length:
                continue
            else:
                return self.device.read(read_length) if hex_flag is None else self.device.read(read_length).hex()


if __name__ == '__main__':
    s = SerialDriver()
    s.init(9600)
    s.write_and_get_buffer("GetVolt")
