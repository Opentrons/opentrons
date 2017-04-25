import glob
import sys
import time

import serial

from opentrons.util.log import get_logger


log = get_logger(__name__)


def get_serial_ports_list():
    """ Lists serial port names

        :raises EnvironmentError:
            On unsupported or unknown platforms
        :returns:
            A list of the serial ports available on the system
    """
    if sys.platform.startswith('win'):
        ports = ['COM%s' % (i + 1) for i in range(256)]
    elif (sys.platform.startswith('linux') or
          sys.platform.startswith('cygwin')):
        # this excludes your current terminal "/dev/tty"
        ports = glob.glob('/dev/tty*')
    elif sys.platform.startswith('darwin'):
        ports = glob.glob('/dev/tty.*')
    else:
        raise EnvironmentError('Unsupported platform')

    result = []
    port_filter = {'usbmodem', 'COM', 'ACM', 'USB'}
    for port in ports:
        try:
            if any([f in port for f in port_filter]):
                s = serial.Serial(port)
                s.close()
                result.append(port)
        except Exception as e:
            log.debug(
                'Exception in testing port {}'.format(port))
            log.debug(e)
    return result


class Connection(object):

    def __init__(self, device, port='', baudrate=115200, timeout=0.02):
        self.serial_timeout = timeout
        self.serial_port = device
        self.serial_port.port = port
        self.serial_port.baudrate = baudrate
        self.serial_port.timeout = timeout

    def device(self):
        return self.serial_port

    def name(self):
        return str(self.serial_port.port)

    def open(self):
        if not self.serial_port.isOpen():
            self.serial_port.open()

    def close(self):
        if self.serial_port.isOpen():
            self.serial_port.close()

    def isOpen(self):
        return bool(self.serial_port.isOpen())

    def serial_pause(self):
        time.sleep(self.serial_timeout)

    def wait_for_write(self):
        self.serial_port.flush()

    def data_available(self):
        return bool(self.serial_port.in_waiting)

    def flush_input(self):
        while self.data_available():
            self.serial_port.reset_input_buffer()
            self.serial_pause()

    def wait_for_data(self, timeout=30):
        end_time = time.time() + timeout
        while end_time > time.time():
            if self.data_available():
                return
        raise RuntimeWarning(
            'No response after {} second(s)'.format(timeout))

    def readline_string(self):
        return str(self.serial_port.readline().decode().strip())

    def write_string(self, data_string):
        self.serial_port.write(data_string.encode())
        self.wait_for_write()
