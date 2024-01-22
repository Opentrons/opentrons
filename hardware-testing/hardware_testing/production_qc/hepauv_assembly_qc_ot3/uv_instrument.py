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

class GT521S_Driver:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600,
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
            request_frame = bytearray([0x01, 0x04, 0x40, 0x44, 0x00, 0x02])

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