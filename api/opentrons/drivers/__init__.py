import configparser
import glob
import json
import os
import pkg_resources
import sys

import serial

from opentrons.util.log import get_logger
from opentrons.drivers.smoothie_driver_1_2_0 import SmoothieDriver_1_2_0
from opentrons.drivers.smoothie_driver_2_0_0 import SmoothieDriver_2_0_0
from opentrons.drivers.virtual_smoothie_1_2_0 import VirtualSmoothie_1_2_0
from opentrons.drivers.virtual_smoothie_2_0_0 import VirtualSmoothie_2_0_0


__all__ = [
]


drivers_by_version = {
    'v1.0.5': SmoothieDriver_1_2_0,
    'edge-1c222d9NOMSD': SmoothieDriver_2_0_0
}
virtual_smoothies_by_version = {
    'v1.0.5': VirtualSmoothie_1_2_0,
    'edge-1c222d9NOMSD': VirtualSmoothie_2_0_0
}


VIRTUAL_SMOOTHIE_PORT = 'Virtual Smoothie'

SMOOTHIE_DEFAULTS_DIR = pkg_resources.resource_filename(
    'opentrons.config', 'smoothie')
SMOOTHIE_DEFAULTS_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'smoothie-defaults.ini')
SMOOTHIE_VIRTUAL_CONFIG_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'config_one_pro_plus')
SMOOTHIE_DEFAULTS = configparser.ConfigParser()
SMOOTHIE_DEFAULTS.read(SMOOTHIE_DEFAULTS_FILE)
defaults = {
    'speeds': json.loads(
        SMOOTHIE_DEFAULTS['state'].get(
            'speeds',
            '{"x": 3000, "y":3000, "z": 1600, "a": 300, "b": 300}'
        )
    ),
    'compatible_firmware': json.loads(
        SMOOTHIE_DEFAULTS['versions'].get('firmware', '[]')
    ),
    'ot_one_dimensions': json.loads(
        SMOOTHIE_DEFAULTS['versions'].get('config', '[]')
    )
}


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


def get_virtual_driver(options):

    default_options = {
        'config_file_path': SMOOTHIE_VIRTUAL_CONFIG_FILE,
        'limit_switches': True,
        'firmware': 'edge-1c222d9NOMSD',
        'config': {
            'ot_version': 'one_pro_plus',
            'version': 'v2.0.0',    # config version
            'alpha_steps_per_mm': 80.0,
            'beta_steps_per_mm': 80.0,
            'gamma_steps_per_mm': 400
        }
    }

    if options:
        default_options['config'].update(options.get('config', {}))
        options['config'] = default_options['config']
        default_options.update(options)

    version_name = default_options.get('firmware')
    vs_class = virtual_smoothies_by_version.get(version_name)
    if not vs_class:
        raise RuntimeError('No virtual smoothie version {}'.format(version_name))

    vs = vs_class(default_options)
    c = connection.Connection(vs, port=VIRTUAL_SMOOTHIE_PORT, timeout=0)
    return initialize_driver(c)


def get_serial_driver(port):
    s = serial.Serial()
    c = connection.Connection(s, port=port, baudrate=115200, timeout=0.01)
    return initialize_driver(c)


def initialize_driver(c):
    driver_class = get_driver_from_version(c)
    d = driver_class(SMOOTHIE_DEFAULTS)
    d.connect(c)
    return d


def get_driver_from_version(c):
    c.open()
    c.flush_input()
    c.write_string('version \r\n')
    c.wait_for_data(timeout=0.5)
    response = c.readline_string()
    c.flush_input()
    
    # {"version":v1.0.5}
    version_1_2_0 = response.split(':')[-1][:-1]

    # Build version: BRANCH-HASH, Build date: Mar 18 2017 21:15:21, MCU: LPC1769, System Clock: 120MHz  # noqa
    #   CNC Build 6 axis
    #   6 axis
    # ok
    version_2_0_0 = response.split(',')[0].split(' ')[-1]  # BRANCH-HASH portion of response

    driver_class = None
    if version_1_2_0 in drivers_by_version:
        driver_class = drivers_by_version[version_1_2_0]
    elif version_2_0_0 in drivers_by_version:
        driver_class = drivers_by_version[version_2_0_0]
    if not driver_class:
        raise RuntimeError('Unknown Smoothie version response: {}'.format(response))

    return driver_class

