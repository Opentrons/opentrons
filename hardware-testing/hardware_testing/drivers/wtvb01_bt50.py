from hardware_testing.drivers.serial_driver import SerialDriver
import time
import codecs
from typing import Optional

READ_LENGTH = 28
START_WORD = 55
FLAG_WORD = 61


class WVTB01_BT50:
    def __init__(self):
        self.baud = 115200
        self.serial = None

    def build_device_by_serial(self):
        self.serial = SerialDriver()
        self.serial.init(self.baud, lable="WVTB01_BT50")

    def build_device_by_bluetooth(self):
        pass

    def read_data(self):
        """
        read buffer
        """
        for i in range(5):
            data = self.serial.read_buffer2(READ_LENGTH, hex_flag=True)
            if len(data) == READ_LENGTH * 2 and str(START_WORD) in data and str(FLAG_WORD) in data:
                return data
            else:
                print(f"Try {i + 1}s Error")

    def cal_get_value(self, value: str):
        """
        计算str类型值，转换为可用的测量值
        """
        value_i = int(value, 16)
        value_h = value_i & 0xFF00
        value_l = value_i & 0x00FF
        value_h = value_h >> 8
        value_l = value_l << 8
        value_ret = value_h + value_l
        return value_ret

    def get_vibration_velocity(self, data) -> dict:
        """
        get x y z, 震动速度
        """

        _x = self.cal_get_value(data[4:8])
        _y = self.cal_get_value(data[8:12])
        _z = self.cal_get_value(data[12:16])
        return {"x": _x, "y": _y, "z": _z}

    def get_vibration_angular(self, data) -> dict:
        """
        get x y z, 震动角度
        """
        _x = self.cal_get_value(data[16:20])
        _y = self.cal_get_value(data[20:24])
        _z = self.cal_get_value(data[24:28])
        return {"x": _x, "y": _y, "z": _z}

    def get_temperature(self, data) -> float:
        """
        get temp
        """
        _temp = self.cal_get_value(data[28: 32])
        return _temp / 100

    def get_vibration_distance(self, data) -> dict:
        """
        get _x, _y, _z, 震动位移 (um)
        """
        _x = self.cal_get_value(data[32:36])
        _y = self.cal_get_value(data[36:40])
        _z = self.cal_get_value(data[40:44])
        return {"x": _x, "y": _y, "z": _z}

    def get_viration_hz(self, data) -> dict:
        """
        get 震动频率 （Hz）
        """
        _x = self.cal_get_value(data[44:48])
        _y = self.cal_get_value(data[48:52])
        _z = self.cal_get_value(data[52:56])
        return {"x": _x, "y": _y, "z": _z}


if __name__ == '__main__':
    device = WVTB01_BT50()
    device.build_device_by_serial()
    while True:
        data = device.read_data()

        result = device.get_vibration_velocity(data)
        print("====震动速度====")
        print(result)
        print('\n')
        result = device.get_vibration_angular(data)
        print("====震动角度=====")
        print(result)
        print('\n')
        result = device.get_temperature(data)
        print("====温度====")
        print(result)
        print('\n')
        result = device.get_vibration_distance(data)
        print("====震动距离=====")
        print(result)
        print('\n')
        result = device.get_viration_hz(data)
        print("====震动频率=====")
        print(result)
        print('\n')

        time.sleep(1)
