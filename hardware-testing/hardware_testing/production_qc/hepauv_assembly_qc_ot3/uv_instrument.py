#! /usr/bin/env python

"""
This driver is meant to be used with the GT-521S Particle Counter.
For more information about this Device, look at the following link:
https://metone.com/wp-content/uploads/2019/10/GT-521S-9800-Rev-D.pdf

Author: Carlos Fernandez
Date: 6/23/2020

"""
import serial
import os, sys, datetime, time
import re

class uv_Driver:
    def __init__(self, port='/dev/ttyUSB0', baudrate=115200,
                parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE,
                    bytesize=serial.EIGHTBITS, timeout=1):

        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.particle_counter = serial.Serial(port = self.port,
                                    baudrate = self.baudrate,
                                    timeout = self.timeout)
       
    
    def get_uv_(self):
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        try:
            # Modbus RTU 请求帧数据（示例数据） 
            # 01 04 01 C4 00 04 B1 C8 高位
            request_frame = bytearray([0x01, 0x04, 0x01, 0xC4, 0x00, 0x04,0xB1, 0xC8])
            # 发送请求
            self.particle_counter.write(request_frame)
            # 延时等待响应
            time.sleep(0.1)
            # 读取响应数据
            response_frame = self.particle_counter.read_all()
            print("Modbus响应帧:", response_frame.hex())
            return response_frame.hex()

        except Exception as e:
            print(f"发生错误: {e}")
    def parse_modbus_data(self,modbus_data_hex):
        # 将十六进制字符串转换为字节数组
        modbus_data_bytes = bytes.fromhex(modbus_data_hex)

        # 解析 Modbus 数据
        device_address = modbus_data_bytes[0]
        function_code = modbus_data_bytes[1]
        byte_count = modbus_data_bytes[2]
        
        uvdatahex = modbus_data_bytes[3:7]  # 去除设备地址、功能码、字节计数和 CRC 校验
        Tempvalhex = modbus_data_bytes[7:-2]

        uvdata = int.from_bytes(uvdatahex, byteorder='big', signed=False)  # 将数据转换为十进制
        Tempval = int.from_bytes(Tempvalhex, byteorder='big', signed=False)  # 将数据转换为十进制

        crc = int.from_bytes(modbus_data_bytes[-2:], byteorder='big')  # 获取 CRC 校验值

        return {
            "Device Address": hex(device_address),
            "Function Code": hex(function_code),
            "Byte Count": hex(byte_count),
            "uvdata": uvdata,
            "Tempval": Tempval,
            "CRC": hex(crc)
        }


if __name__ == '__main__':
    port = "/dev/tty.usbserial-130"
    a = uv_Driver(port)
    # modbus_data_hex = a.get_uv_()
    # 解析 Modbus 数据
    cccc = "0104080000000000E30000D5FB"
    parsed_data = a.parse_modbus_data(cccc)

    # 打印解析结果
    for key, value in parsed_data.items():
        print(f"{key}: {value}")