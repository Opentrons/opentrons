import configparser
import glob
import os
import pkg_resources
import sys

import serial

from opentrons.util.log import get_logger
from opentrons.drivers import connection
from opentrons.drivers.smoothie_drivers.v1_2_0.driver \
    import SmoothieDriver_1_2_0
from opentrons.drivers.smoothie_drivers.v2_0_0.driver \
    import SmoothieDriver_2_0_0
from opentrons.drivers.smoothie_drivers.v1_2_0.virtual_smoothie \
    import VirtualSmoothie_1_2_0
from opentrons.drivers.smoothie_drivers.v2_0_0.virtual_smoothie \
    import VirtualSmoothie_2_0_0


__all__ = [
]


drivers_by_version = {
    'v1.0.5': SmoothieDriver_1_2_0,
    'edge-1c222d9NOMSD': SmoothieDriver_2_0_0,
    'edge-049af91NOMSD': SmoothieDriver_2_0_0
}
virtual_smoothies_by_version = {
    'v1.0.5': VirtualSmoothie_1_2_0,
    'edge-1c222d9NOMSD': VirtualSmoothie_2_0_0,
    'edge-049af91NOMSD': VirtualSmoothie_2_0_0
}


VIRTUAL_SMOOTHIE_PORTS = list(virtual_smoothies_by_version.keys())

SMOOTHIE_DEFAULTS_DIR = pkg_resources.resource_filename(
    'opentrons.config', 'smoothie')
SMOOTHIE_DEFAULTS_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'smoothie-defaults.ini')
SMOOTHIE_VIRTUAL_CONFIG_FILE = os.path.join(
    SMOOTHIE_DEFAULTS_DIR, 'config_one_pro_plus')
SMOOTHIE_DEFAULTS = configparser.ConfigParser()
SMOOTHIE_DEFAULTS.read(SMOOTHIE_DEFAULTS_FILE)


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


def get_virtual_driver(port='edge-1c222d9NOMSD', options={}):

    FIRMWARE_VERSION = port

    default_options = {
        'config_file_path': SMOOTHIE_VIRTUAL_CONFIG_FILE,
        'limit_switches': True,
        'firmware': FIRMWARE_VERSION,
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
        raise RuntimeError(
            'No virtual smoothie version {}'.format(version_name))

    vs = vs_class(default_options)
    c = connection.Connection(vs, port=port, timeout=0)
    return get_driver(c)


def get_serial_driver(port):
    s = serial.Serial()
    c = connection.Connection(s, port=port, baudrate=115200, timeout=0.01)
    return get_driver(c)


def get_driver(c):
    driver_class = drivers_by_version.get(get_version(c))
    if driver_class:
        d = driver_class(SMOOTHIE_DEFAULTS)
        d.connect(c)
        return d
    else:
        raise RuntimeError(
            'Can not read version from port "{}"'.format(c.name()))


def get_version(c):
    c.open()
    c.serial_pause()
    c.flush_input()
    c.write_string('version \r\n')
    response = c.readline_string(timeout=3)
    c.flush_input()
    c.close()

    # {"version":v1.0.5}
    v = response.split(':')[-1][:-1]
    if v in drivers_by_version:
        return v

    # Build version: BRANCH-HASH, Build date: Mar 18 2017 21:15:21, MCU: LPC1769, System Clock: 120MHz  # noqa
    #   CNC Build 6 axis
    #   6 axis
    # ok
    v = response.split(',')[0].split(' ')[-1]  # BRANCH-HASH
    if v in drivers_by_version:
        return v
