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
        self.initialize_connection()

    def initialize_connection(self):
        """Outputs every command for the Particle Counter"""
        #Flush input buffer, discarding all its contents
        self.particle_counter.flushInput()
        count = 0
        read=True
        while read:
            self.particle_counter.write('\r\n'.encode("utf-8"))
            data_output = self.particle_counter.readline().decode("utf-8")
            self.particle_counter.flush()
            #print(data_output)
            if self.particle_counter.inWaiting():
                break
            count += 1
            if count > 2:
                read = False

    def help_menu(self):
        """Displays the help menu"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('?,H\r\n'.encode("utf-8"))
        data_output = self.particle_counter.readall()
        print(data_output.decode('utf-8'))
        """Clear output buffer, aborting the current output and discarding all
        that is in the buffer """
        self.particle_counter.flushOutput()

    def unit_settings(self):
        """Returns the unit’s settings information"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('1\r\n'.encode("utf-8"))
        data_output = self.particle_counter.readall()
        print(data_output.decode())

    def serial_number(self):
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('SS\r\n'.encode("utf-8"))
        self.particle_counter.readline()
        serial_number = self.particle_counter.readline()
        serial_number = serial_number.strip(b'\r\n')
        SN = str(serial_number.decode("utf-8"))
        return SN

    def software_version(self):
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('OP\r\n'.encode("utf-8"))
        software_version = self.filter_output()
        return software_version

    def location_ID(self):
        """This may be a workstation ID?"""
        pass

    def read_serial_mode(self):
        self.particle_counter.write('SE\r\n'.encode("utf-8"))
        serial_mode = self.filter_output()
        return serial_mode

    def alarm_limit(self):
        pass

    def available_records(self):
        #Data gets output in a list of 12 elements
        total_samples = 7
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('2\r\n'.encode("utf-8"))
        self.filter_output()
        self.filter_output()
        raw_data = []
        #print("Standard Output")
        for samples in range(1, total_samples+3):
            data_output = self.particle_counter.readline()
            data_output = data_output.decode("utf-8").strip('\r\n')
            #print(data_output)
            raw_data.append(data_output)
        #del raw_data[0]
        #print(raw_data)
        #print(samples)
        header_dict = {}
        filter_list = []
        for add in range(1, total_samples+2):
            filter_list.append(re.split(',', raw_data[add]))
        #print(filter_list)
        #print("Header: ")
        for header in filter_list[0]:
            header_dict[header] = ''
        #print(header_dict)
        # print("Samples: ")
        # for sample in filter_list[1:]:
        #     print(sample)

        return header_dict, filter_list[1:]

    def read_all_records(self):
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('3\r\n'.encode("utf-8"))
        data_output = self.particle_counter.readall()
        return data_output.decode()

    def clear_data(self):
        """Clears data in memory"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('C \r\n'.encode("utf-8"))
        self.particle_counter.write('Y \r\n'.encode("utf-8"))
        data_output = self.particle_counter.readall()
        #print(data_output.decode())
        self.particle_counter.flushOutput()

    def set_date(self, today_date):
        """Date (mm/dd/yy)Set Date"""
        self. particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('D {}'.format(today_date).encode("utf-8"))

    def set_time(self, TIME):
        """Time (hh:MM:ss)Set Time"""
        self. particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('T {}'.format(TIME).encode("utf-8"))

    def start_sampling(self):
        self.particle_counter.write('S\r\n'.encode("utf-8"))

    def end_sampling(self):
        self.particle_counter.write('E\r\n'.encode("utf-8"))

    def set_hold_time(self, hold_time):
        """Set Hold Time in seconds"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('SH {}\r\n'.format(hold_time).encode("utf-8"))

    def set_sample_time(self, sample_time):
        """Set Sample Time in seconds"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('ST {}\r\n'.format(sample_time).encode("utf-8"))

    def set_number_of_samples(self, num_of_samples):
        """Set Number of Samples(0=Repeat, 1=Single, 2-999=N samples)"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('SN {}\r\n'.format(num_of_samples).encode("utf-8"))

    def set_temperature_unit(self):
        pass

    def count_units(self):
        pass

    def channel_size_information(self):
        pass

    def operation_status(self):
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('OP\r\n'.encode("utf-8"))
        unit_status = self.filter_output()
        for stat in unit_status:
            if stat == 'R':
                return 'Running'
            elif stat == 'S':
                return 'Stop'
            elif stat == 'H':
                return 'Hold'

    def set_channel_sizes(self, chan_size):
        """Set Channel Sizes (2Channel Sizes)CS sz1 sz2"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('CS {}\r\n'.format(chan_size).encode("utf-8"))

    def set_count_mode(self, input):
        """Set Count Mode 0=Normal, 1=Difference"""
        self.particle_counter.flush()
        self.particle_counter.flushInput()
        self.particle_counter.write('CM {}\r\n'.format(input).encode("utf-8"))

    def filter_output(self):
        """This filters the extra junk of the serial connection"""
        count = 0
        read = True
        while read:
            count +=1
            data_output = self.particle_counter.readline()
            #print(data_output.decode('utf-8'))
            if count == 2:
                read=False
        return data_output.decode("utf-8")

if __name__ == '__main__':
    port='/dev/tty.usbserial-0001'
    PARTICLE_COUNTER = GT521S_Driver(port=port)
    SN = PARTICLE_COUNTER.serial_number().strip("SS").replace(' ', '')
    # PARTICLE_COUNTER.clear_data()
    # unit_settings = PARTICLE_COUNTER.unit_settings()
    # SN = PARTICLE_COUNTER.serial_number()
    # print("Serial Number: ", SN)
    # PARTICLE_COUNTER.start_sampling()
    # time.sleep(1)
    # stats = PARTICLE_COUNTER.operation_status()
    # print(stats)
    # operation = True
    # while operation:
    #     stats = PARTICLE_COUNTER.operation_status()
    #     time.sleep(1)
    #     print(stats)
    #     if stats == "Stop":
    #         operation = False
    PARTICLE_COUNTER.initialize_connection()
    PARTICLE_COUNTER.clear_data()
    PARTICLE_COUNTER.set_number_of_samples(6)
    PARTICLE_COUNTER.start_sampling()
    time.sleep(185)
    header, data = PARTICLE_COUNTER.available_records()
    print(header)
    print(data)
    new_dict = {}
    for key, value in zip(header.items(), data[0]):
        for x in key:
            print(x)
            new_dict[x] = value
        print(value)
    print(new_dict)
