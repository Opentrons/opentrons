from collections import namedtuple
import json
import logging
import os
from typing import Any, Dict, List, Tuple

from opentrons.config import get_config_index, feature_flags as fflags

log = logging.getLogger(__name__)

ROBOT_CONFIG_VERSION = 3

TIP_PROBE_BOUNCE_DISTANCE = 5.0

# The X and Y switch offsets are to position relative to the *opposite* axes
# during calibration, to make the tip hit the raised end of the switch plate,
# which requires less pressure to activate. E.g.: when probing in the x
# direction, the tip will be moved by X_SWITCH_OFFSET in the y axis, and when
# probing in y, it will be adjusted by the Y_SWITCH_OFFSET in the x axis.
# When probing in z, it will be adjusted by the Z_SWITCH_OFFSET in the y axis.

TIP_PROBE_X_SWITCH_OFFSET = 2.0
TIP_PROBE_Y_SWITCH_OFFSET = 5.0
TIP_PROBE_Z_SWITCH_OFFSET = 5.0
TIP_PROBE_SWITCH_CLEARANCE = 7.5

TIP_PROBE_Z_CLEARANCE_NORMAL = 5.0
TIP_PROBE_Z_CLEARANCE_DECK = 5.0
TIP_PROBE_Z_CLEARANCE_START = 20
TIP_PROBE_Z_CLEARANCE_CROSSOVER = 35

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
B_MAX_SPEED = 40
C_MAX_SPEED = 40

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

tip_probe_z_clearance = namedtuple(
    'tip_probe_z_clearance',
    [
        'normal',
        'deck',
        'crossover',
        'start'
    ]
)

tip_probe_config = namedtuple(
    'tip_probe_config',
    [
        'bounce_distance',
        'switch_offset',
        'switch_clearance',
        'z_clearance',
        'center',
        'dimensions'
    ]
)

robot_config = namedtuple(
    'robot_config',
    [
        'name',
        'version',
        'steps_per_mm',
        'acceleration',
        'gantry_calibration',
        'instrument_offset',
        'serial_speed',
        'tip_length',
        'default_current',
        'low_current',
        'high_current',
        'default_max_speed',
        'mount_offset',
        'log_level',
        'tip_probe'
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
    inst_offs: dict = {'right': {}, 'left': {}}
    pip_types = ['single', 'multi']
    prev_instrument_offset = robot_settings.get('instrument_offset', {})
    for mount in inst_offs.keys():
        mount_dict = prev_instrument_offset.get(mount, {})
        for typ in pip_types:
            inst_offs[mount][typ] = mount_dict.get(typ, DEFAULT_INST_OFFSET)
    return inst_offs


def _ensure_tip_probe_offsets(maybe_offsets):
    if not isinstance(maybe_offsets, list) or len(maybe_offsets) != 3:
        return [TIP_PROBE_X_SWITCH_OFFSET,
                TIP_PROBE_Y_SWITCH_OFFSET,
                TIP_PROBE_Z_SWITCH_OFFSET]
    else:
        return maybe_offsets


def _build_z_clearance(z_clearance: dict) -> tip_probe_z_clearance:
    return tip_probe_z_clearance(
        normal=z_clearance.get('normal', TIP_PROBE_Z_CLEARANCE_NORMAL),
        deck=z_clearance.get('deck', TIP_PROBE_Z_CLEARANCE_DECK),
        crossover=z_clearance.get('crossover',
                                  TIP_PROBE_Z_CLEARANCE_CROSSOVER),
        start=z_clearance.get('start',
                              TIP_PROBE_Z_CLEARANCE_START)
    )


def _build_tip_probe(tip_probe_settings: dict) -> tip_probe_config:
    return tip_probe_config(
        bounce_distance=tip_probe_settings.get('bounce_distance',
                                               TIP_PROBE_BOUNCE_DISTANCE),
        switch_offset=_ensure_tip_probe_offsets(tip_probe_settings.get(
            'switch_offset', [])),
        switch_clearance=tip_probe_settings.get('switch_clearance',
                                                TIP_PROBE_SWITCH_CLEARANCE),
        z_clearance=_build_z_clearance(tip_probe_settings.get('z_clearance',
                                                              {})),
        center=tip_probe_settings.get('center', _default_probe_center()),
        dimensions=tip_probe_settings.get('dimensions',
                                          _default_probe_dimensions())
    )


def _build_config(deck_cal: List[List[float]],
                  robot_settings: Dict[str, Any]) -> robot_config:
    cfg = robot_config(
        name=robot_settings.get('name', 'Ada Lovelace'),
        version=int(robot_settings.get('version', ROBOT_CONFIG_VERSION)),
        steps_per_mm=robot_settings.get('steps_per_mm', DEFAULT_STEPS_PER_MM),
        acceleration=robot_settings.get('acceleration', DEFAULT_ACCELERATION),
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
        log_level=robot_settings.get('log_level', DEFAULT_LOG_LEVEL),
        tip_probe=_build_tip_probe(robot_settings.get('tip_probe', {}))
    )
    return cfg


def _config_to_save(
        config: robot_config) -> Tuple[List[List[float]], Dict[str, Any]]:
    top = dict(config._asdict())
    top['tip_probe'] = dict(top['tip_probe']._asdict())
    top['tip_probe']['z_clearance'] = dict(
        top['tip_probe']['z_clearance']._asdict())
    gc = top.pop('gantry_calibration')
    return gc, top


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
    cal_lists, _ = _config_to_save(config)

    dc_filename = dc_filename or get_config_index().get('deckCalibrationFile')
    if tag:
        root, ext = os.path.splitext(dc_filename)
        dc_filename = "{}-{}{}".format(root, tag, ext)
    deck_calibration = {
        'gantry_calibration': cal_lists}
    _save_json(deck_calibration, filename=dc_filename)


def save_robot_settings(config: robot_config, rs_filename=None, tag=None):
    _, config_dict = _config_to_save(config)

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


# TODO: move to util (write a default load, save JSON function)
def _load_json(filename) -> dict:
    try:
        with open(filename, 'r') as file:
            res = json.load(file)
    except FileNotFoundError:
        log.warning('{0} not found. Loading defaults'.format(filename))
        res = {}
    except json.decoder.JSONDecodeError:
        log.warning('{0} is corrupt. Loading defaults'.format(filename))
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
