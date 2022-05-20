#! /usr/bin/env python

"""
Radwag Scale Driver
The driver allows a user to retrieve raw data
from the scale by using a USB connection.
Specify the port to establish Connection

Author: Carlos Fernandez

"""

import serial
import time
import re
from statistics import mode
from serial.serialutil import SerialException
from typing import Any, Dict, Union, List, Optional, Tuple
import random

from serial.tools.list_ports import comports


class Radwag_ScaleError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return 'Bad Scale Readings: ' + repr(self.value)


class Radwag_Scale:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.timeout = 0.1
        self.max_tries = 25
        self.total_reads = 10
        self.simulate = False
        self._scale = None
        self._time_delay = 0.3
        self._limit_sensor = None
        self._location = "NY"

    def scan_for_port(self, name: str) -> str:
        """This funtion scans for these individual ports by VID:PID names"""
        # There may be something wrong with particle counter and robot port
        instruments = {
            'sensor': 'USB VID:PID=1A86:7523'
        }
        port = None
        ports = comports()
        if name == '' or name == None:
            raise Exception("No instrument was named!")
        port_list = []
        for com_port, desc, hwid in sorted(ports):
            # print("{}: {} [{}]".format(com_port, desc, hwid))
            port_list.append((com_port, desc, hwid))
            # print(port_list)
        for vid in range(len(port_list)):
            if instruments[name] in port_list[vid][2]:
                port = port_list[vid][0]
        return port

    def connect(self):
        if self.simulate:
            print("Virtual Scale Port Connected")
        else:
            print("Scale Connection established: ", self.port)
            self._connect_to_port()
            if self._location is not 'NY':
                self._limit_sensor = serial.Serial(port=self.scan_for_port('sensor'),
                                               baudrate=115200,
                                               parity=serial.PARITY_NONE,
                                               stopbits=serial.STOPBITS_ONE,
                                               bytesize=serial.EIGHTBITS,
                                               timeout=0.1)

    def _connect_to_port(self):
        try:
            self._scale = serial.Serial(port=self.port,
                                        baudrate=self.baudrate,
                                        parity=serial.PARITY_NONE,
                                        stopbits=serial.STOPBITS_ONE,
                                        bytesize=serial.EIGHTBITS,
                                        timeout=self.timeout)
        except SerialException:
            error_msg = '\nUnable to access Serial port to Scale: \n'
            error_msg += '1. Check that the scale is plugged into the computer. \n'
            error_msg += '2. CHeck if the assigned port is correct. \n'
            raise SerialException(error_msg)

    # Obtain a single reading of scale
    def read_mass(self, samples=2, retry=0):
        if not self.simulate:
            masses = []
            retry += 1
            try:
                for n in range(samples):
                    self._scale.flush()
                    self._scale.flushInput()
                    self._scale.write('SI\r\n'.encode("utf-8"))
                    raw_val = self._scale.readline().strip()
                    # print("split into list", raw_val)
                    (junk, val) = re.split("SI ", raw_val.decode('utf-8'))
                    if raw_val == '':
                        print('Not data retrived')
                        self._scale.read_mass()
                    val = val.replace('SI', '')
                    val = val.replace('g', '')
                    val = val.replace('++', '+')
                    val = val.replace('--', '-')
                    val = val.replace('^', '')
                    val = val.replace('?', '')
                    # print(val)
                    data = float(val)
                    masses.append(data)
                    # print(masses)

            except ValueError:
                if retry > 3:
                    raise RuntimeError("Scale is giving dirty output")
                else:
                    return self.read_mass(retry)

            masses = self.strip_outliners(masses)
            clean_average = sum(masses) / len(masses)
            # print(masses)
            return clean_average
        else:
            return random.uniform(2.5, 2.7)

    def stable_read(self, samples=10):
        '''take 10 samples due to stablitiy of the scale'''
        if not self.simulate:
            masses = []
            stats_list = ['', 'SU A', 'ES', 'SU E', 'A']
            for n in range(1, samples + 1):
                self._scale.flush()
                self._scale.flushInput()
                self._scale.flushOutput()
                condition = True
                while condition:
                    self._scale.write('SU\r\n'.encode("utf-8"))
                    raw_val = self._scale.readline().decode('utf-8')
                    raw_val = raw_val.strip()
                    if raw_val in stats_list or "SU" not in raw_val:
                        time.sleep(0.4)
                    else:
                        condition = False
                sign = 1
                (junk, val) = re.split("SU ", raw_val)
                val = val.replace('g', '')
                # compensate for negative sign
                if val[2] == '-':
                    sign = -1
                    val = val.replace('-', '')
                val = float(val) * sign
                masses.append(val)
            # disregard readings and take 7-9 readings
            masses = masses[7:]
            masses = self.strip_outliners(masses)
            # Average the readings
            clean_average = sum(masses) / len(masses)
            return clean_average
        else:
            return random.uniform(2.5, 2.7)

    def read_continuous(self) -> float:
        if not self.simulate:
            masses = []
            while True:
                if len(masses) == 10:
                    break
                self._scale.flushInput()
                time.sleep(self._time_delay)
                condition = True
                times_count = 1
                self._scale.write('SU\r\n'.encode("utf-8"))
                while condition:
                    time.sleep(self._time_delay)
                    raw_val = ''
                    for r in self._scale.readlines():
                        raw_val = raw_val + r.decode('utf-8').strip()
                    # print(raw_val)
                    raw_val = raw_val.replace('SU', ' ').replace('A', ' ') \
                        .replace('ES', ' ').replace('\n', ' ') \
                        .replace('\t', ' ').replace('\r', ' ') \
                        .replace(' ', '').replace('g', '')
                    print("time_count:\t", times_count, "\tRaw scale reading", raw_val)
                    times_count = times_count + 1
                    if len(raw_val.replace('-', '').replace('E', '')) > 6:
                        self._scale.flushOutput()
                        condition = False
                    if 'E' in raw_val or times_count % 110 == 0:
                        raw_val = raw_val.replace('E', '')
                        self._scale.flushInput()
                        time.sleep(self._time_delay)
                        self._scale.write('SU\r\n'.encode("utf-8"))
                        # print("send SU again")
                    if times_count % 250 == 0:
                        self.open_lid()
                        time.sleep(2)
                        self.close_lid()
                        time.sleep(2)
                    if times_count > 600:
                        raise Exception("Can't take reading")
                if times_count > 50:
                    masses = []
                if raw_val[0] == '-':
                    sign = -1
                    raw_val = raw_val.replace('-', '')
                    raw_val = float(raw_val) * sign
                masses.append(float(raw_val))
                # print(masses)
            # disregard readings and take 7-9 readings
            masses = masses[7:]
            masses = self.strip_outliners(masses)
            # Average the readings
            clean_average = sum(masses) / len(masses)
            return clean_average
        else:
            time.sleep(0.5)
            return random.uniform(2.5, 2.7)

    def beep_scale(self):
        self._scale.write('BP 500\r\n'.encode("utf-8"))

    """These commands open or close the evaporation trap lid"""

    def open_lid(self):
        if not self.simulate:
            self._scale.flushInput()
            time.sleep(self._time_delay)
            self._scale.write('OC\r\n'.encode("utf-8"))
            condition = True
            response = ''
            count = 1
            while condition:
                count = count + 1
                time.sleep(self._time_delay)
                for r in self._scale.readlines():
                    response = response + r.decode('utf-8').strip()
                print("response from while loop 1: ", response)
                limit_state = self.checkLidStatus()
                print(limit_state)
                if 'OK' in response and 'OCOK' in limit_state:
                    print("LID opened")
                    condition = False
                if 'E' in response:
                    self._scale.write('CC\r\n'.encode("utf-8"))
                if count > 20:
                    raise Exception("Open lid raise Error")
            time.sleep(1)
        else:
            print("LID OPENED")

    def close_lid(self):
        if not self.simulate:
            self._scale.flushInput()
            time.sleep(self._time_delay)
            self._scale.write('CC\r\n'.encode("utf-8"))
            condition = True
            response = ''
            count = 1
            while condition:
                count = count + 1
                time.sleep(self._time_delay)
                for r in self._scale.readlines():
                    response = response + r.decode('utf-8').strip()
                print("response from while loop 2: ", response)
                limit_state = self.checkLidStatus()
                print(limit_state)
                if "OK" in response and 'CCOK' in limit_state :
                    print("LID Closed")
                    condition = False
                if 'E' in response:
                    self._scale.write('CC\r\n'.encode("utf-8"))
                if count > 10:
                    raise Exception("Close lid raise Error")
            time.sleep(1)
        else:
            print("LID CLOSED")

    """These commands open or close the glass enclosure door on the right side"""

    def open_chamber(self):
        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write('OD\r\n'.encode("utf-8"))
        time.sleep(2)
        condition = True
        count = 0
        while condition:
            response = self._scale.readline().decode("utf-8")
            print(response)
            if response == '':
                condition = False
            if response == "OD D\r\n":
                print("LID already opened")
                condition = False
            elif response == "OD E\r\n":
                print("Error in course of command execution, \
                                                no parameter or command format")
            elif response == "OD A\r\n":
                print("Command understood and in progress")
            else:
                raise Exception("Incorrect option {}".format(response))

    def close_chamber(self):
        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write('CD\r\n'.encode("utf-8"))
        time.sleep(2)
        condition = True
        while condition:
            response = self._scale.readline().decode("utf-8")
            # print(response)
            if response == '':
                condition = False
            elif response == "CD D\r\n":
                print("chamber already closed")
                condition = False
            elif response == "CD E\r\n":
                print("Error in course of command execution, \
                                                no parameter or command format")
            elif response == "CD A\r\n":
                print("Command understood and in progress")
            else:
                raise Exception("Incorrect option {}".format(response))

    def checkLidStatus(self):
        if self._location is 'NY':
            res = "CCOK OCOK"
            return res
        self._limit_sensor.flush()
        self._limit_sensor.flushInput()
        self._limit_sensor.flushOutput()
        res = self._limit_sensor.readline().decode("utf-8").strip()
        # print(res)
        return res

    def profile_mode(self, mode_string):
        """
        There are four different profiles the user can choose from
        Fast, Fast dosing, Precision, and User. The input string needs to have
        the first letter of the word captial.
        """
        if not self.simulate:
            time.sleep(1)
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write('PROFILE {}\r\n'.format(mode_string).encode("utf-8"))
            condition = True
            while condition:
                response = self._scale.readline().decode("utf-8")
                if response == "PROFILE OK\r\n":
                    print(" Profile set: ", mode_string, response)
                    condition = False
        else:
            response = "PROFILE OK\r\n"
            print(" Profile set: ", mode_string, response)

    """strip outliners"""

    def strip_outliners(self, masses):
        rounded_masses = [round(mass) for mass in masses]
        mode_mass = mode(rounded_masses)
        outliers_stripped = [mass for mass in masses if abs(mass - mode_mass) < 1]
        return outliers_stripped

    def get_serial_number(self):
        if not self.simulate:
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write('NB\r\n'.encode("utf-8"))
            condition = True
            response = self._scale.readline().decode("utf-8").strip()
            response = response.replace('"', '')
            response = response.replace(' ', '-')
            return response
        else:
            response = "NB-01-00101"
            return response

    def tare_scale(self):
        if not self.simulate:
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write('T\r\n'.encode("utf-8"))
            time.sleep(5)
        else:
            print("SCALE HAS BEEN TARE")

    def disable_internal_adjustment(self):
        if not self.simulate:
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write('IC1\r\n'.encode("utf-8"))
            time.sleep(5)
        else:
            print("DISABLED INTERNAL ADJUSTMENT")


if __name__ == '__main__':
    # port = input("Enter port number, leave blank for '/dev/ttyUSB0/'\n").strip()
    # if port == '':
    com_port = "COM6"
    scale = Radwag_Scale(port=com_port)
    scale.simulate = False
    scale._location = 'CH'
    scale.connect()
    # res = scale.scan_for_port('sensor')
    # print(res)
    # while True:
    #     res = scale.checkLidStatus()
    #     print(res)
    #     time.sleep(0.2)
    # print(time.tzname[time.daylight])

    while True:
        #time.sleep(0.2)
        scale.close_lid()
        # time.sleep(1)
        reading = scale.read_continuous()
        scale.open_lid()
        time.sleep(1)
