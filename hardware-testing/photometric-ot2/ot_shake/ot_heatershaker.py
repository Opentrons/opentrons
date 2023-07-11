#! /usr/bin/env python
"""
ot_heatershaker.py

This is a simple driver to communicate to the Opentrons HeaterShaker Gen1 module.

Author: Carlos Fernandez
Senior Robotics Test Engineer

Last Revision: 01-27-2022 (Thassyo Pinto)
"""
import os
import sys
import time
import serial

class Timer():
    def __init__(self):
        self.start_time = None
        self.elapsed_time = None

    def start(self):
        # Start a new timer
        self.start_time = time.perf_counter()

    def elapsed(self):
        # Return elapsed time
        self.elapsed_time = time.perf_counter() - self.start_time
        return self.elapsed_time

    def stop(self):
        if self.start_time is None:
            raise TimerError(f"Timer is not running. Use .start() to start it")
        stop_time = time.perf_counter()


class HeaterShaker_Fixture():
    """
    This class is for the heatershaker fixture that is using a thermocycler
    PCB and is modify to output wells instead of thermistors names of the
    thermocycler.
    """
    def __init__(self, port="/dev/ttyACM0", baudrate=115200):
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.ACK = "\r\n"
        self.GCODE = {
            "DEBUG_MODE":"M111"
        }
        self.timer = Timer()
        self.fixture = None

    def connect(self):
        self.connect_to_port()

    def connect_to_port(self):
        try:
            self.fixture = serial.Serial(port = self.PORT,
                                          baudrate = self.BAUDRATE,
                                          parity = serial.PARITY_NONE,
                                          stopbits = serial.STOPBITS_ONE,
                                          bytesize = serial.EIGHTBITS,
                                          timeout = self.TIMEOUT)
        except serial.SerialException:
            error_msg = '\nUnable to access Serial port to HS Fixture: \n'
            error_msg += '1. Check that the Fixture is plugged into the computer. \n'
            error_msg += '2. Check if the assigned port is correct. \n'
            raise serial.SerialException(error_msg)

    def disconnect(self):
        self.fixture.close()

    def send_packet(self, packet):
        self.module.flushInput()
        self.module.write(packet.encode("utf-8"))

    def write_continous_transmission(self):
        self.packet = "{}{}".format(self.GCODE["DEBUG_MODE"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            stats = self.fixture.readline()
            #print(stats)
            if stats != b'':
                reading = False
        return stats

    def get_fixture_temperature(self):
        """This returns all the well temperatures for one fixture"""
        count = 0
        dict = {}
        self.fixture.flush()
        self.fixture.flushInput()
        reading = True
        while reading:
            stats = self.fixture.readline()
            if stats != b'':
                reading = False
        stats = stats.decode().strip()
        stats = stats.split()
        for i in stats:
            if count % 2:
                dict.update({save_text: i})
            save_text = i
            save_text = save_text.replace(':','')
            count +=1
        return dict

class Opentrons_HeaterShaker():
    def __init__(self, port="/dev/ttyACM0", baudrate=115200):
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.ACK = "\r\n"
        self.GCODE = {
            "HOME_PLATE":"G28",
            "GET_INFO":"M115",
            "SET_RPM":"M3",
            "GET_RPM":"M123",
            "SET_TEMP":"M104",
            "GET_TEMP":"M105",
            "SET_ACC":"M204",
            "SET_PID":"M301",
            "GET_LOCK":"M241",
            "OPEN_LOCK":"M242",
            "CLOSE_LOCK":"M243",
            "SET_HEATER":"M104.D",
            "DEBUG_INFO":"M105.D",
            "DEACTIVATE_HEATER":"M106"
        }
        self.timer = Timer()
        self.module = None
        self.packet = None
        self.thermistors = {
            "TempA":None,
            "TempB":None,
            "TempC":None
        }

    def connect(self):
        connection = self.connect_to_port()
        return connection

    def connect_to_port(self):
        try:
            self.module = serial.Serial(port = self.PORT,
                                        baudrate = self.BAUDRATE,
                                        parity = serial.PARITY_NONE,
                                        stopbits = serial.STOPBITS_ONE,
                                        bytesize = serial.EIGHTBITS,
                                        timeout = self.TIMEOUT)
            return self.module
        except serial.SerialException:
            error_msg = '\nUnable to access Serial port to HeaterShaker: \n'
            error_msg += '1. Check that the HeaterShaker is plugged into the computer. \n'
            error_msg += '2. Check if the assigned port is correct. \n'
            raise serial.SerialException(error_msg)

    def disconnect(self):
        self.module.close()

    def send_packet(self, packet):
        self.module.flushInput()
        self.module.write(packet.encode("utf-8"))

    def set_rpm(self, rpm: int):
        self.packet = "{} S{}{}".format(self.GCODE["SET_RPM"], rpm, self.ACK)
        self.send_packet(self.packet)
        reading = True
        "Must return M3 OK"
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def get_rpm(self):
        self.packet = "{}{}".format(self.GCODE["GET_RPM"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        "Must return M123 C{Current} T{RPM} OK"
        while reading:
            rpm = self.module.readline()
            #print(rpm)
            if b'OK' in rpm:
                reading = False
        rpm = rpm.decode()
        return rpm

    def set_temperature(self, target_temp: float):
        self.packet = "{} S{}{}".format(self.GCODE["SET_TEMP"], target_temp, self.ACK)
        self.send_packet(self.packet)
        reading = True
        "Must return M{Temperature} OK"
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def get_temperature(self):
        # Example: M105 C20.88 T20.00 OK
        self.packet = "{}{}".format(self.GCODE["GET_TEMP"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        "Must return M105 C{current} T{Temperature} OK"
        while reading:
            temperature = self.module.readline()
            #print(temperature)
            if b'OK\n' in temperature:
                reading = False
        temperature = temperature.decode()
        #temperature = temperature.replace(' ', ',')
        temperature = temperature.split()[1]
        temperature = temperature.replace('C:','')
        return float(temperature)

    def set_acceleration(self, acceleration: int):
        self.packet = "{} S{}{}".format(self.GCODE["SET_ACC"], acceleration, self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            accel = self.module.readline()
            print(accel)
            if b'OK\n' in accel:
                reading = False
        accel = accel.decode()
        return accel

    def debug_information(self):
        self.packet = "{}{}".format(self.GCODE["DEBUG_INFO"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            stats = self.module.readline()
            #print(stats)
            if b'OK\n' in stats:
                reading = False
        stats = stats.decode().strip()
        data_output = stats.split()
        temp_A = data_output[1]
        temp_B = data_output[2]
        temp_C = data_output[3]
        ADC_A = data_output[4]
        ADC_B = data_output[5]
        ADC_C = data_output[6]
        info = {'TempA': float(temp_A.strip('AT:')),
                'TempB': float(temp_B.strip('BT:')),
                'TempC': float(temp_C.strip('OT:')),
                'ADC_A': ADC_A.strip('AD:'),
                'ADC_B': ADC_B.strip('BD:'),
                'ADC_C': ADC_C.strip('OD:')
                }
        return info

    def set_heater_power(self, power: int):
        self.packet = "{} S{}{}".format(self.GCODE["SET_HEATER"], power, self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            stats = self.module.readline()
            print(stats)#True
            if stats == b'M104.D OK\n':
                reading = False

    def set_heater_pid(self, P: float, I: float, D: float):
        """
        Pxxx where P is between -200 and 200: P constant
        Ixxxx where I is between -200 and 200: I constant
        Dxxxx where D is between -200 and 200:  D  constant
        """
        self.module.flushInput()
        self.module.write('M301 P{} I{} D{}\r\n'.format(P,I,D).encode("utf-8"))
        reading = True
        while reading:
            stats = self.module.readline()
            print(stats)
            if stats == b'M301 OK\n':
                reading = False

    def set_dfu_mode(self):
        self.module.flushInput()
        self.module.write('dfu {}\r\n'.format(rpm).encode("utf-8"))
        reading = True
        while reading:
            stats = self.module.readline()
            print(stats)
            if stats == b'':
                reading = False

    def get_version_information(self):
        self.packet = "{}{}".format(self.GCODE["GET_INFO"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)
        status = status.decode()
        return status

    def home_plate(self):
        self.packet = "{}{}".format(self.GCODE["HOME_PLATE"], self.ACK)
        self.send_packet(self.packet)
        time.sleep(0.01)
        reading = True
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def engage_solenoid(self, milliamps: int):
        self.module.flushInput()
        self.module.write('G28.D S{}\r\n'.format(milliamps).encode("utf-8"))
        reading = True
        while reading:
            stats = self.module.readline()
            print(stats)
            if stats == b'G28.D OK\n':
                reading = False

    def disengage_solenoid(self):
        self.module.flushInput()
        self.module.write('G28.D S0\r\n'.format(rpm).encode("utf-8"))
        reading = True
        while reading:
            stats = self.module.readline()
            print(stats)
            if stats == b'G28.D OK\n':
                reading = False

    def open_plate_lock(self):
        self.packet = "{}{}".format(self.GCODE["OPEN_LOCK"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def close_plate_lock(self):
        self.packet = "{}{}".format(self.GCODE["CLOSE_LOCK"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def get_plate_lock_state(self):
        self.packet = "{}{}".format(self.GCODE["GET_LOCK"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            status = self.module.readline()
            #print(stats)
            # if status == b'M241 OK\n': # in stats:
            #     reading = False
            if b'OK' in status:
                reading = False
        status = status.decode()
        return status

    def set_led_debug(self, led_mode: int):
        self.module.flushInput()
        self.module.write('M994.D {}\r\n'.format(led_mode).encode("utf-8"))
        reading = True
        "Must return M994.D OK"
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

    def deactivate_heater(self):
        self.packet = "{}{}".format(self.GCODE["DEACTIVATE_HEATER"], self.ACK)
        self.send_packet(self.packet)
        reading = True
        while reading:
            status = self.module.readline()
            if b'\n' in status:
                reading = False
                print(status)

if __name__ == '__main__':
    module = Opentrons_HeaterShaker(port="/dev/ttyACM0")
    module.connect()
    module.timer.start()
    set_temp = float(input("Enter a set temperature: "))
    module.set_temperature(set_temp)
    while True:
       data = module.debug_information()
       elapsed_time = module.timer.elapsed()
       print("Time: ", round(elapsed_time, 3), "Data: ", data)
       time.sleep(1.0)
