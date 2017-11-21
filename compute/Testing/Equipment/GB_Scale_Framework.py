"""
This framework is to establish a connection to
the GB/T26497-2011 Scale, this allows for users
to obtain readings.

Creator: Jared , Carlos
Date: 11/6/2017
Branch: system_testing
"""
import serial
import time
import os
import re
#from opentrons import instruments
#from opentrons.helpers import helpers
import csv
from statistics import mode

#Location of the user Data
USER_DATA = '/data/user_storage'

PIPETTE = 'p200'
VOLUME = 200
RUNS = 20
NEW_TIP_FREQUENCY= 10

#Special id is just used for file naming - does not change program behavior
SPECIAL_ID = 'pre-wet-tips'

#The number of readings to average from the scale for each measurement
NUMBER_OF_MASS_READINGS_TO_AVERAGE = 10

MASS_OF_MICRO_LIT_OF_WATER = .001
port = '/dev/ttyUSB0'
time_of_run = time.strftime("%H-%M-%S_%b%d", time.localtime())

'''
Uncomment OSX variables below if using mac - requires a special driver 
which can be found at https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers
'''

#OSX variables
port = '/dev/tty.SLAB_USBtoUART'

class scale_Error(Exception):
    def __init__(self,value):
        self.value = value
    def __str__(self):
        return repr(self.value)
        
class ScaleConnection(object):

    def __init__(self, port, baudrate = 8, parity = None, stopbits = 1):
        self.serial_timeout = 1.0
        try: # The pi alternates when scale is reconnected. Just hackey protection from that
            self.connection = serial.Serial(
                port=port, baudrate=baudrate, timeout=self.serial_timeout)
            self.connection.flushInput()
            
            
        except serial.serialutil.SerialException:
            port = '/dev/ttyUSB1'
            self.connection = serial.Serial(
                port=port, baudrate=baudrate, timeout=self.serial_timeout)
            self.connection.flushInput()


    def read_mass(self, retry=0):
        '''
        Reads and parses scale data. Sometimes the scale
        gives garbarge data that can't be cleaned. We will retry up to
        4 times. If we get 4 cycles of garbage than there is something wrong 
        with the scale. 
        '''
        retry += 1
        try:
            self.connection.flushInput()
            raw_mass = self.connection.readline()
            if not raw_mass:
                raise RuntimeError("Scale issue - is scale plugged in and on?")
            mass = ''.join(re.split('[g,\s]* ', raw_mass.decode()))
            mass = mass.replace('++', '+')
            mass = mass.replace('--', '-')
            data = float(mass)
            return data
        except ValueError as e:
            if retry > 3:
                raise RuntimeError("Scale is giving dirty output")
            else:
                return self.read_mass(retry)


def strip_outliers(masses):
    '''
    Takes in a list of masses and cleans it. This is done by
    removing measurements that are 
    more than 1 gram away from the rounded value. These are
    understood to be garbage output from the scale.
    '''
    rounded_masses = [round(mass) for mass in masses]
    mode_mass = mode(rounded_masses)
    outliers_stripped = [mass for mass in masses if abs(mass-mode_mass) < 1]
    return outliers_stripped


class Scale(object):
    def __init__(self, port):
        self.serial_connection = ScaleConnection(port, 9600)

    def read_mass(self):
        #if(getattr(robot, 'mode') == 'live'):
        reading = self._read_average_mass(NUMBER_OF_MASS_READINGS_TO_AVERAGE)
        return reading
        #else:
            #return None
    
    def _read_average_mass(self, samples=3, sleep = 0.1):
        time.sleep(sleep)
        masses = [self.serial_connection.read_mass() for i in range(samples)]
        clean_masses = strip_outliers(masses)
        clean_average = sum(clean_masses)/len(clean_masses)
        return clean_average


def save_to_file(data_array):
    #if not getattr(robot, 'mode') == 'live':
        #return
     
    full_path = os.path.join(USER_DATA, PIPETTE, str(VOLUME), SPECIAL_ID, # Creates the name of the file for the current run - ugly but expressive
        'time-{}_pip-{}_vol-{}_newTip-{}_id-{}.csv'.format(time_of_run, PIPETTE, str(VOLUME), str(NEW_TIP_FREQUENCY), SPECIAL_ID))
    directory_path = os.path.dirname(full_path)
    if not os.path.exists(directory_path):
        os.makedirs(directory_path) 
   
    
    with open(full_path, 'a', newline='') as csv_file:
        writer = csv.writer(csv_file, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)
        ret = writer.writerow(data_array)


def process_and_record_data(run, mass_initial, mass_final, volume):

    '''
    Takes in iteration parameters data and writes it to a csv 
    '''
    
    this_time = time.strftime("%H:%M:%S", time.localtime())
    expected_difference = (MASS_OF_MICRO_LIT_OF_WATER) * volume
    observed_difference = mass_final - mass_initial
    delta = expected_difference - observed_difference
    data = [this_time, run, mass_initial, mass_final, volume, expected_difference, observed_difference, delta]
    print("data: ", data)
    save_to_file(data)



def main():
    scale = Scale(port = 'COM6')
    data_columns = ["Time Stamp", "Iteration",
    "Initial Mass", "Final Mass", "Volume", "Expected Difference", "Actual Difference",
    "Delta"]
    save_to_file(data_columns)

    for i in range(RUNS):
        mass_initial = scale.read_mass()
        mass_final = scale.read_mass()
        process_and_record_data(i, mass_initial, mass_final, VOLUME)

if __name__ == '__main__':
    read = Scale(port = 'COM6')
    try:
        reading = read.read_mass()
        print("mass(g) = {}".format(reading))
    except:
        print("Cancelled Reading transmittion")



