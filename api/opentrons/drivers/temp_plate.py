from opentrons.drivers.smoothie_drivers import serial_communication as sc

from os import environ


GCODES = {'SET_TEMP': 'M104 S{temp}',
          'GET_TEMP': 'M105'}

BAUD_RATE = 9600
TEMP_THRESHOLD = 1
SHUTDOWN_TEMP = 0


def _parse_temp(raw_temp):
    parsed_values = raw_temp.split(':')
    return float(parsed_values[1])


class TemperaturePlateDriver:
    def __init__(self):
        self.target_temp = None
        self.simulating = True

    def connect(self, vid):
        self.simulating = False
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return
        port = sc.get_port_by_VID(vid)
        if port is None:
            raise RuntimeError("No valid port found for connection")
        self._connection = sc._connect(port, baudrate=BAUD_RATE)

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
        self.target_temp = temp
        self._send_command(GCODES['SET_TEMP'].format(temp=temp))

    def get_temp(self):
        if self.simulating:
            return self.target_temp
        else:
            raw_temp = self._send_command(GCODES['GET_TEMP'])
            return _parse_temp(raw_temp)

    def shutdown(self):
        self._send_command(GCODES['SET_TEMP'].format(temp=SHUTDOWN_TEMP))
