# In this file we often align code for readability triggering PEP8 warnings
# So...
# pylama:skip=1

from collections import namedtuple
from opentrons.util import environment
from opentrons.config import merge, children, build
from opentrons.config import feature_flags as fflags

import json
import os
import logging
import time

log = logging.getLogger(__name__)


PLUNGER_CURRENT_LOW = 0.1
PLUNGER_CURRENT_HIGH = 0.5

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 1.0

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.5

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.75

HIGH_CURRENT = {
    'X': X_CURRENT_HIGH,
    'Y': Y_CURRENT_HIGH,
    'Z': MOUNT_CURRENT_HIGH,
    'A': MOUNT_CURRENT_HIGH,
    'B': PLUNGER_CURRENT_HIGH,
    'C': PLUNGER_CURRENT_HIGH
}

LOW_CURRENT = {
    'X': X_CURRENT_LOW,
    'Y': Y_CURRENT_LOW,
    'Z': MOUNT_CURRENT_LOW,
    'A': MOUNT_CURRENT_LOW,
    'B': PLUNGER_CURRENT_LOW,
    'C': PLUNGER_CURRENT_LOW
}

DEFAULT_CURRENT = {
    'X': HIGH_CURRENT['X'],
    'Y': HIGH_CURRENT['Y'],
    'Z': HIGH_CURRENT['Z'],
    'A': HIGH_CURRENT['A'],
    'B': LOW_CURRENT['B'],
    'C': LOW_CURRENT['C']
}

X_MAX_SPEED = 600
Y_MAX_SPEED = 400
Z_MAX_SPEED = 100
A_MAX_SPEED = 100
B_MAX_SPEED = 50
C_MAX_SPEED = 50

DEFAULT_MAX_SPEEDS = {
    'X': X_MAX_SPEED,
    'Y': Y_MAX_SPEED,
    'Z': Z_MAX_SPEED,
    'A': A_MAX_SPEED,
    'B': B_MAX_SPEED,
    'C': C_MAX_SPEED
}

DEFAULT_CURRENT_STRING = ' '.join(
    ['{}{}'.format(key, value) for key, value in DEFAULT_CURRENT.items()])

DEFAULT_PROBE_HEIGHT = 77.0


robot_config = namedtuple(
    'robot_config',
    [
        'name',
        'version',
        'steps_per_mm',
        'acceleration',
        'gantry_calibration',
        'instrument_offset',
        'probe_center',
        'probe_dimensions',
        'serial_speed',
        'plunger_current_low',
        'plunger_current_high',
        'tip_length',
        'default_current',
        'low_current',
        'high_current',
        'default_max_speed'
    ]
)


def _get_default():
    if fflags.short_fixed_trash():
        probe_height = 55.0
    else:
        probe_height = DEFAULT_PROBE_HEIGHT

    return robot_config(
        name='Ada Lovelace',
        version=1,
        steps_per_mm='M92 X80.00 Y80.00 Z400 A400 B768 C768',
        acceleration='M204 S10000 X3000 Y2000 Z1500 A1500 B2000 C2000',
        probe_center=(293.03, 301.27, probe_height),
        probe_dimensions=(35.0, 40.0, probe_height + 5.0),
        gantry_calibration=[
            [ 1.00, 0.00, 0.00,  0.00],
            [ 0.00, 1.00, 0.00,  0.00],
            [ 0.00, 0.00, 1.00,  0.00],
            [ 0.00, 0.00, 0.00,  1.00]
        ],
        instrument_offset={
            'right': {
                'single': (0.0, 0.0, 0.0),
                'multi': (0.0, 0.0, 0.0)
            },
            'left': {
                'single': (0.0, 0.0, 0.0),
                'multi': (0.0, 0.0, 0.0)
            }
        },
        tip_length={
            'Pipette': 51.7 # TODO (andy): move to tip-rack
        },
        serial_speed=115200,
        default_current=DEFAULT_CURRENT,
        low_current=LOW_CURRENT,
        high_current=HIGH_CURRENT,
        default_max_speed=DEFAULT_MAX_SPEEDS,
        plunger_current_low=PLUNGER_CURRENT_LOW,
        plunger_current_high=PLUNGER_CURRENT_HIGH
    )


def load(filename=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    result = _get_default()

    try:
        with open(filename, 'r') as file:
            local = json.load(file)
            local = _check_version_and_update(local)
            result = robot_config(**merge([result._asdict(), local]))
    except FileNotFoundError:
        log.warning('Config {0} not found. Loading defaults'.format(filename))
    except json.decoder.JSONDecodeError:
        log.warning('Config {0} is corrupt. Loading defaults'.format(filename))

    return result


def save(config, filename=None, tag=None):

    filename = filename or environment.get_path('OT_CONFIG_FILE')
    if tag:
        root, ext = os.path.splitext(filename)
        filename = "{}-{}{}".format(root, tag, ext)
    _default = children(_get_default()._asdict())

    diff = build([
        item for item in children(config._asdict())
        if item not in _default
    ])
    return _save_config_json(diff, filename=filename, tag=tag)


def backup_configuration(config, tag=None):
    import time
    if not tag:
        tag = str(int(time.time() * 1000))
    save(config, tag=tag)


def clear(filename=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    log.info('Deleting config file: {}'.format(filename))
    if os.path.exists(filename):
        os.remove(filename)


def _save_config_json(config_json, filename=None, tag=None):
    filename = filename or environment.get_path('OT_CONFIG_FILE')
    if tag:
        root, ext = os.path.splitext(filename)
        filename = "{}-{}{}".format(root, tag, ext)

    with open(filename, 'w') as file:
        json.dump(config_json, file, sort_keys=True, indent=4)
        return config_json


def _check_version_and_update(config_json):
    migration_functions = {
        0: _migrate_zero_to_one
    }

    version = config_json.get('version', 0)

    if version in migration_functions:
        # backup the loaded configuration json file
        tag = '{}-v{}'.format(
            int(time.time() * 1000),
            version)
        _save_config_json(config_json, tag=tag)
        # migrate the configuration file
        migrate_func = migration_functions[version]
        config_json = migrate_func(config_json)
        # recursively update the config
        # until there are no more migration methods for its version
        config_json = _check_version_and_update(config_json)

    return config_json


def _migrate_zero_to_one(config_json):
    # add a version number to the config, and set to 1
    config_json['version'] = 1
    # overwrite instrument_offset to the default
    _default = _get_default()
    config_json['instrument_offset'] = _default.instrument_offset.copy()
    config_json['tip_length'] = _default.tip_length.copy()
    return config_json

