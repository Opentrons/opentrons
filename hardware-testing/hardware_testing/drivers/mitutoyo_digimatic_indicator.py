"""
mitutoyo_digimatic_indicator.py

This is a simple driver to communicate with Mitutoyo ABSOLUTE Digimatic Indicator ID-S.

Author: Thassyo Pinto
thassyo.pinto@opentrons.com
Last Revision: 10-12-2022
"""
import sys
import csv
import time
import numpy
import serial

class Timer:
    def __init__(self):
        self.start_time = None
        self.elapsed_time = None

    def start(self):
        self.start_time = time.perf_counter()

    def elapsed(self):
        self.elapsed_time = time.perf_counter() - self.start_time
        return self.elapsed_time

class Mitutoyo_Digimatic_Indicator:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600):
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        self.raise_exceptions = True
        self.reading_raw = ''
        self.GCODE = {
            "READ":"r",
        }
        self.timer = Timer()
        self.gauge = None
        self.packet = None

    def connect(self):
        try:
            self.gauge = serial.Serial(port = self.PORT,
                                        baudrate = self.BAUDRATE,
                                        parity = serial.PARITY_NONE,
                                        stopbits = serial.STOPBITS_ONE,
                                        bytesize = serial.EIGHTBITS,
                                        timeout = self.TIMEOUT)
        except serial.SerialException:
            error = "Unable to access Serial port"
            raise serial.SerialException(error)

    def disconnect(self):
        self.gauge.close()

    def send_packet(self, packet):
        self.gauge.flush()
        self.gauge.flushInput()
        self.gauge.write(packet.encode("utf-8"))

    def get_packet(self):
        self.gauge.flushOutput()
        packet = self.gauge.readline().decode("utf-8")
        return packet

    def read(self):
        self.packet = self.GCODE["READ"]
        self.send_packet(self.packet)
        time.sleep(0.001)
        reading = True
        while reading:
            data = self.get_packet()
            if data != "":
                reading = False
        return float(data)

    def read_stable(self,  timeout: float = 5):
        then = time.time()
        values = [self.read(), self.read(), self.read(), self.read(), self.read()]
        while (time.time() - then) < timeout:
            if numpy.allclose(values, list(reversed(values))):
                return values[-1]
            values = values[1:] + [self.read()]
        raise RuntimeError("Couldn't settle")

if __name__ == '__main__':
    print("Mitutoyo ABSOLUTE Digimatic Indicator")
    gauge = Mitutoyo_Digimatic_Indicator(port="/dev/ttyUSB0")
    gauge.connect()
    gauge.timer.start()
    while True:
        elapsed_time = round(gauge.timer.elapsed(), 3)
        distance = gauge.read()
        print("Time: {} Distance: {}".format(elapsed_time, distance))
