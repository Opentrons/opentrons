from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication as sc
from serial.tools import list_ports

from os import environ


GCODES = {'SET_TEMP': 'M104 S{temp}',
          'GET_TEMP': 'M105'}

BAUD_RATE = 9600
TEMP_THRESHOLD = 1
SHUTDOWN_TEMP = 0

def _parse_temp(raw_temp):
    print(raw_temp)
    parsed_values = raw_temp.split(':')
    return float(parsed_values[1])

def get_ports(device_name):
    '''Returns all serial devices with a given name'''
    for d in list_ports.comports():
        if d.manufacturer is not None and device_name in d.manufacturer:
            return d[0]

class TemperaturePlateDriver:
    def __init__(self):
        self.target_temp = None
        self.simulating = True

    def connect(self, manuf_id):
        self.simulating = False
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return

        #TODO jg 11/29: connect() in serial should be able to parse for different port attributes
        self._connection = sc._connect(
            get_ports(manuf_id),
            baudrate=BAUD_RATE
        )

    def disconnect(self):
        self.simulating = True

    def _send_command(self, command, timeout=None):
        if self.simulating:
            pass
        else:
            ret_code = sc.write_and_return(
                command, self._connection, timeout)

            return ret_code

    def set_temp(self, temp, wait=False):
        self._send_command(GCODES['SET_TEMP'].format(temp=temp))


    def get_temp(self):
        if self.simulating:
            return self.target_temp
        else:
            raw_temp = self._send_command(GCODES['GET_TEMP'])
            print(raw_temp)
            return _parse_temp(raw_temp)

    def shutdown(self):
        self._send_command(GCODES['SET_TEMP'].format(temp=SHUTDOWN_TEMP))
