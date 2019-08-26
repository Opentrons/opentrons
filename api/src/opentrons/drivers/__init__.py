import configparser
import glob
import os
import pkg_resources
import sys
import logging

import serial  # type: ignore

from opentrons.drivers import connection

VIRTUAL_SMOOTHIE_PORT = 'Virtual Smoothie'

SMOOTHIE_DEFAULTS_DIR = pkg_resources.resource_filename(
    'opentrons.config', 'smoothie')
SMOOTHIE_DEFAULTS_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'smoothie-defaults.ini')
SMOOTHIE_VIRTUAL_CONFIG_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'config_one_pro_plus')
SMOOTHIE_DEFAULTS = configparser.ConfigParser()
SMOOTHIE_DEFAULTS.read(SMOOTHIE_DEFAULTS_FILE)


log = logging.getLogger(__name__)


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
    port_filter = {'usbmodem', 'usbserial', 'COM', 'ACM', 'USB'}
    for port in ports:
        try:
            if any([f in port for f in port_filter]):
                s = serial.Serial()
                c = connection.Connection(
                    s, port=port, baudrate=115200, timeout=0.01)
                c.open()
                result.append(port)
        except Exception as e:
            log.debug(
                'Exception in testing port {}'.format(port))
            log.debug(e)
    return result
