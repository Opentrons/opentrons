# In this file we often align code for readability triggering PEP8 warnings
# So...
# pylama:skip=1

from collections import namedtuple
from opentrons.util import environment
from opentrons.config import merge, children, build

import json
import os
import logging

log = logging.getLogger(__name__)


PLUNGER_CURRENT_LOW = 0.1
PLUNGER_CURRENT_HIGH = 0.5
MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 1.0
X_CURRENT_HIGH = 1.5
Y_CURRENT_HIGH = 1.7

DEFAULT_POWER = {
    'X': X_CURRENT_HIGH,
    'Y': Y_CURRENT_HIGH,
    'Z': MOUNT_CURRENT_HIGH,
    'A': MOUNT_CURRENT_HIGH,
    'B': PLUNGER_CURRENT_LOW,
    'C': PLUNGER_CURRENT_LOW
}

DEFAULT_POWER_STRING = ' '.join(
    ['{}{}'.format(key, value) for key, value in DEFAULT_POWER.items()])

robot_config = namedtuple(
    'robot_config',
    [
        'name',
        'steps_per_mm',
        'max_speeds',
        'acceleration',
        'current',
        'gantry_calibration',
        'instrument_offset',
        'probe_center',
        'probe_dimensions',
        'serial_speed',
        'plunger_current_low',
        'plunger_current_high',
        'tip_length',
        'default_power'
    ]
)


default = robot_config(
    name='Ada Lovelace',
    steps_per_mm='M92 X80.00 Y80.00 Z400 A400 B768 C768',
    max_speeds='M203.1 X550 Y400 Z120 A120 B40 C40',
    acceleration='M204 S10000 X3000 Y2000 Z1500 A1500 B2000 C2000',
    current='M907 ' + DEFAULT_POWER_STRING,
    probe_center=(295.0, 300.0, 55.0),
    probe_dimensions=(35.0, 40.0, 60.0),
    gantry_calibration=[  # "safe" offset, overwrote in factory calibration
        [ 1.00, 0.00, 0.00,  -27.0],
        [ 0.00, 1.00, 0.00,   -10],
        [ 0.00, 0.00, 1.00,  -10],
        [ 0.00, 0.00, 0.00,   1.00]
    ],
    # left relative to right
    instrument_offset={
        'right': {
            'single': (0.0, 0.0, 0.0),        # numbers are from CAD
            'multi': (0.0, (9 * 3.5), -25.8)  # numbers are from CAD
        },
        'left': {
            'single': (-34, 0.0, 0.0),        # numbers are from CAD
            'multi': (-34,  (9 * 3.5), -25.8) # numbers are from CAD
        }
    },
    tip_length={
        'left': {
            'single': 51.7,
            'multi': 51.7
        },
        'right': {
            'single': 51.7,
            'multi': 51.7
        }
    },
    serial_speed=115200,
    default_power=DEFAULT_POWER,
    plunger_current_low=PLUNGER_CURRENT_LOW,
    plunger_current_high=PLUNGER_CURRENT_HIGH
)


def load(filename=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    result = default

    try:
        with open(filename, 'r') as file:
            local = json.load(file)
            result = robot_config(**merge([default._asdict(), local]))
    except FileNotFoundError as e:
        log.info('Config {0} not found. Loading defaults'.format(filename))

    return result


def save(config, filename=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    _default = children(default._asdict())

    diff = build([
        item for item in children(config._asdict())
        if item not in _default
    ])

    with open(filename, 'w') as file:
        json.dump(diff, file, sort_keys=True, indent=4)
        return diff


def clear(filename=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    log.debug('Deleting config file: {}'.format(filename))
    if os.path.exists(filename):
        os.remove(filename)
