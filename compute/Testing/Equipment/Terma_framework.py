#! /usr/bin/env python
"""
Terma Digimatic Dial indicator framework.

Written by Carlos Fernandez
12/5/2017
"""
import sys
import os
import serial
import time

class TermaError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

class TermaGauge(serial.Serial):
    def gauge_read(self, bytesize=8):
        self.error_count = 0 # let's keep track of consecutive errors only
        while self.error_count < self.max_errors:
            # get new data
            self.flush()
            self.flushInput()
            self.write("r".encode())
            time.sleep(0.2)
            self.raw_reading = self.read(bytesize)
            try:
                reading = float(self.raw_reading)
                self.error_count = 0
                return reading
            except:
                if not self.unlimited_errors:
                    self.error_count += 1
                continue
        if self.raise_exceptions:
            raise TermaError("%d consecutive failed attemps to read data. Last data received: '%s'" % (self.max_errors,self.reading_raw))
        return 'no reading'


    def __init__(self, port='/dev/ttyUSB0', baudrate=9600, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE, bytesize=serial.EIGHTBITS, timeout=0.1):
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        self.raise_exceptions = True
        self.reading_raw = ''
        # Most likely port is the only parameter that would change
        self = serial.Serial.__init__(self,
            port=port,
            baudrate=baudrate,
            parity=parity,
            stopbits=stopbits,
            bytesize=bytesize,
            timeout=timeout)

class TermaGaugeNull(serial.Serial):
    """ Fake Terma connection """
    def __init__(self, *args, **kwargs):
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        pass
    
    def gauge_read(self, bytesize=6):
        return float(1)

    def flush():
        pass

    def read():
        pass

    def readline():
        pass

    def write():
        pass

if __name__ == '__main__':
    #port = input("Enter port number, leave blank for '/dev/ttyUSB0/'\n").strip()
    #if port == '':
        #port='/dev/ttyUSB0'
    gauge = TermaGauge(port='COM26')
    gauge.unlimited_errors = True
    while True:
        reading = gauge.gauge_read()
        print(reading)
