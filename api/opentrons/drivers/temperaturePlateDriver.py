from opentrons.drivers.smoothie_drivers import serial_communication as sc
from serial.tools import list_ports


GCODES = {'SET_TEMP': 'M104 S{temp}',
          'GET_TEMP': 'M105'}

BAUD_RATE = 9600
TEMP_THRESHOLD = 1 # Tolerance used when waiting to reach target temp
SHUTDOWN_TEMP = 0 # When this temperature is sent to the module it turns off
DEFAULT_TEMP = 4 # Temperature target that the module starts with


def _parse_temp(raw_temp):
    print(raw_temp)
    parsed_values = raw_temp.split(':')
    return float(parsed_values[1])

def get_ports(device_name):
    '''Returns all serial devices with a given manufacturer ID'''
    for d in list_ports.comports():
        if d.manufacturer is not None and device_name in d.manufacturer:
            return d[0]


class TemperaturePlateDriver:
    def __init__(self):
        self.target_temp = DEFAULT_TEMP

    def connect(self, manuf_id, simulating):
        if simulating:
            return
        else:
            self._conn =\
                sc._connect(get_ports(manuf_id), baudrate=BAUD_RATE)

    def _send_command(self, command, simulating, timeout=None):
        if simulating:
            pass
        else:
            return sc.write_and_return(command, self._conn, timeout)

    def set_temp(self, temp, simulating, wait=False):
        self.target_temp = temp
        self._send_command(GCODES['SET_TEMP'].format(temp=temp), simulating)

    def get_temp(self, simulating):
        if simulating:
            return self.target_temp
        else:
            raw_temp = self._send_command(GCODES['GET_TEMP'], simulating)
            return _parse_temp(raw_temp)

    def shutdown(self, simulating):
        self._send_command(GCODES['SET_TEMP'].format(temp=SHUTDOWN_TEMP), simulating)
