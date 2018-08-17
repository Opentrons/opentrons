from collections import namedtuple
from opentrons.config import get_config_index, feature_flags as fflags

import json
import os
import logging

log = logging.getLogger(__name__)

ROBOT_CONFIG_VERSION = 2

PLUNGER_CURRENT_LOW = 0.05
PLUNGER_CURRENT_HIGH = 0.5

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 0.8

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.25

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.25

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
Z_MAX_SPEED = 125
A_MAX_SPEED = 125
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

DEFAULT_DECK_CALIBRATION = [
    [1.00, 0.00, 0.00,  0.00],
    [0.00, 1.00, 0.00,  0.00],
    [0.00, 0.00, 1.00,  0.00],
    [0.00, 0.00, 0.00,  1.00]]

DEFAULT_ACCELERATION = 'M204 S10000 X3000 Y2000 Z1500 A1500 B2000 C2000'
DEFAULT_STEPS_PER_MM = 'M92 X80.00 Y80.00 Z400 A400 B768 C768'
DEFAULT_PROBE_HEIGHT = 77.0
DEFAULT_MOUNT_OFFSET = [-34, 0, 0]
DEFAULT_INST_OFFSET = [0.0, 0.0, 0.0]
SERIAL_SPEED = 115200
DEFAULT_TIP_LENGTH_DICT = {'Pipette': 51.7}
DEFAULT_LOG_LEVEL = 'INFO'

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
        'tip_length',
        'default_current',
        'low_current',
        'high_current',
        'default_max_speed',
        'mount_offset',
        'log_level'
    ]
)


def _default_probe_center():
    if fflags.short_fixed_trash():
        probe_height = 55.0
    else:
        probe_height = DEFAULT_PROBE_HEIGHT
    return [293.03, 301.27, probe_height]


def _default_probe_dimensions():
    if fflags.short_fixed_trash():
        probe_height = 55.0
    else:
        probe_height = DEFAULT_PROBE_HEIGHT
    return [35.0, 40.0, probe_height + 5.0]


def _build_fallback_instrument_offset(robot_settings: dict) -> dict:
    # because `instrument_offset` is a dict of dicts, we must loop through it
    # and replace empty values with the default offset
    inst_offs = {'right': {}, 'left': {}}
    pip_types = ['single', 'multi']
    prev_instrument_offset = robot_settings.get('instrument_offset', {})
    for mount in inst_offs.keys():
        mount_dict = prev_instrument_offset.get(mount, {})
        for typ in pip_types:
            inst_offs[mount][typ] = mount_dict.get(typ, DEFAULT_INST_OFFSET)
    return inst_offs


def _build_config(deck_cal: list, robot_settings: dict) -> robot_config:
    cfg = robot_config(
        name=robot_settings.get('name', 'Ada Lovelace'),
        version=int(robot_settings.get('version', ROBOT_CONFIG_VERSION)),
        steps_per_mm=robot_settings.get('steps_per_mm', DEFAULT_STEPS_PER_MM),
        acceleration=robot_settings.get('acceleration', DEFAULT_ACCELERATION),
        probe_center=robot_settings.get(
            'probe_center', _default_probe_center()),
        probe_dimensions=robot_settings.get(
            'probe_dimensions', _default_probe_dimensions()),
        gantry_calibration=deck_cal or DEFAULT_DECK_CALIBRATION,
        instrument_offset=_build_fallback_instrument_offset(robot_settings),
        tip_length=robot_settings.get('tip_length', DEFAULT_TIP_LENGTH_DICT),
        mount_offset=robot_settings.get('mount_offset', DEFAULT_MOUNT_OFFSET),
        serial_speed=robot_settings.get('serial_speed', SERIAL_SPEED),
        default_current=robot_settings.get('default_current', DEFAULT_CURRENT),
        low_current=robot_settings.get('low_current', LOW_CURRENT),
        high_current=robot_settings.get('high_current', HIGH_CURRENT),
        default_max_speed=robot_settings.get(
            'default_max_speed', DEFAULT_MAX_SPEEDS),
        log_level=robot_settings.get('log_level', DEFAULT_LOG_LEVEL)
    )
    return cfg


def load(deck_cal_file=None):
    deck_cal_file = deck_cal_file or get_config_index().get(
        'deckCalibrationFile')
    log.info("Loading deck calibration from {}".format(deck_cal_file))
    deck_cal = _load_json(deck_cal_file).get('gantry_calibration', {})
    settings_file = get_config_index().get('robotSettingsFile')
    log.info("Loading robot settings from {}".format(settings_file))
    robot_settings = _load_json(settings_file) or {}
    return _build_config(deck_cal, robot_settings)


def save_deck_calibration(config: robot_config, dc_filename=None, tag=None):
    config_dict = config._asdict()

    dc_filename = dc_filename or get_config_index().get('deckCalibrationFile')
    if tag:
        root, ext = os.path.splitext(dc_filename)
        dc_filename = "{}-{}{}".format(root, tag, ext)
    deck_calibration = {
        'gantry_calibration': config_dict.pop('gantry_calibration')}
    _save_json(deck_calibration, filename=dc_filename)


def save_robot_settings(config: robot_config, rs_filename=None, tag=None):
    config_dict = config._asdict()
    config_dict.pop('gantry_calibration')

    # Save everything else in a different file
    rs_filename = rs_filename or get_config_index().get('robotSettingsFile')
    if tag:
        root, ext = os.path.splitext(rs_filename)
        rs_filename = "{}-{}{}".format(root, tag, ext)
    _save_json(config_dict, filename=rs_filename)

    return config_dict


def backup_configuration(config: robot_config, tag=None):
    import time
    if not tag:
        tag = str(int(time.time() * 1000))
    save_deck_calibration(config, tag=tag)
    save_robot_settings(config, tag=tag)


def clear(calibration=True, robot=True):
    if calibration:
        _clear_file(get_config_index().get('deckCalibrationFile'))
    if robot:
        _clear_file(get_config_index().get('robotSettingsFile'))


def _clear_file(filename):
    log.debug('Deleting {}'.format(filename))
    if os.path.exists(filename):
        os.remove(filename)


def _load_json(filename) -> dict:
    try:
        with open(filename, 'r') as file:
            res = json.load(file)
    except FileNotFoundError:
        print('Warning: {0} not found. Loading defaults'.format(filename))
        res = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt. Loading defaults'.format(filename))
        res = {}
    return res


def _save_json(data, filename):
    # print("Saving json file at {}".format(filename))
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w') as file:
            json.dump(data, file, sort_keys=True, indent=4)
        return data
    except OSError:
        log.exception('Write failed with exception:')
