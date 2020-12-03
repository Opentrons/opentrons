from collections import namedtuple
import json
import logging
import os

from numpy import array, array_equal  # type: ignore
from opentrons.util import linal
from typing import Any, Dict, List, Union

from opentrons import config
from opentrons.config import CONFIG, feature_flags as fflags

log = logging.getLogger(__name__)

ROBOT_CONFIG_VERSION = 3

PLUNGER_CURRENT_LOW = 0.05
PLUNGER_CURRENT_HIGH = 0.05

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 0.8

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.25

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.25

Z_RETRACT_DISTANCE = 2

HIGH_CURRENT: Dict[str, float] = {
    'X': X_CURRENT_HIGH,
    'Y': Y_CURRENT_HIGH,
    'Z': MOUNT_CURRENT_HIGH,
    'A': MOUNT_CURRENT_HIGH,
    'B': PLUNGER_CURRENT_HIGH,
    'C': PLUNGER_CURRENT_HIGH
}

LOW_CURRENT: Dict[str, float] = {
    'X': X_CURRENT_LOW,
    'Y': Y_CURRENT_LOW,
    'Z': MOUNT_CURRENT_LOW,
    'A': MOUNT_CURRENT_LOW,
    'B': PLUNGER_CURRENT_LOW,
    'C': PLUNGER_CURRENT_LOW
}

DEFAULT_CURRENT: Dict[str, float] = {
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

DEFAULT_MAX_SPEEDS: Dict[str, float] = {
    'X': X_MAX_SPEED,
    'Y': Y_MAX_SPEED,
    'Z': Z_MAX_SPEED,
    'A': A_MAX_SPEED,
    'B': B_MAX_SPEED,
    'C': C_MAX_SPEED
}

DEFAULT_CURRENT_STRING = ' '.join(
    ['{}{}'.format(key, value) for key, value in DEFAULT_CURRENT.items()])

DEFAULT_DECK_CALIBRATION: List[List[float]] = [
    [1.00, 0.00, 0.00, 0.00],
    [0.00, 1.00, 0.00, 0.00],
    [0.00, 0.00, 1.00, 0.00],
    [0.00, 0.00, 0.00, 1.00]]

DEFAULT_DECK_CALIBRATION_V2: List[List[float]] = [
    [1.00, 0.00, 0.00],
    [0.00, 1.00, 0.00],
    [0.00, 0.00, 1.00]]

DEFAULT_SIMULATION_CALIBRATION: List[List[float]] = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, -25.0],
    [0.0, 0.0, 0.0, 1.0]
]

X_ACCELERATION = 3000
Y_ACCELERATION = 2000
Z_ACCELERATION = 1500
A_ACCELERATION = 1500
B_ACCELERATION = 200
C_ACCELERATION = 200

DEFAULT_ACCELERATION: Dict[str, float] = {
    'X': X_ACCELERATION,
    'Y': Y_ACCELERATION,
    'Z': Z_ACCELERATION,
    'A': A_ACCELERATION,
    'B': B_ACCELERATION,
    'C': C_ACCELERATION
}

DEFAULT_PIPETTE_CONFIGS: Dict[str, float] = {
    'homePosition': 220,
    'stepsPerMM': 768,
    'maxTravel': 30
}

DEFAULT_GANTRY_STEPS_PER_MM: Dict[str, float] = {
    'X': 80.00,
    'Y': 80.00,
    'Z': 400,
    'A': 400
}

DEFAULT_STEPS_PER_MM = 'M92 X80.00 Y80.00 Z400 A400 B768 C768'
# This probe height is ~73 from deck to the top surface of the switch body
# per CAD; 74.3mm is the nominal for engagement from the switch drawing.
# Note that this has a piece-to-piece tolerance stackup of +-1.5mm
# Switch drawing: https://www.mouser.com/datasheet/2/307/en-d2f-587403.pdf
# model no D2F-01L
DEFAULT_PROBE_HEIGHT = 74.3
DEFAULT_MOUNT_OFFSET = [-34, 0, 0]
DEFAULT_INST_OFFSET = [0.0, 0.0, 0.0]
DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]
SERIAL_SPEED = 115200
DEFAULT_TIP_LENGTH_DICT = {'Pipette': 51.7}
DEFAULT_LOG_LEVEL = 'INFO'

robot_config = namedtuple(
    'robot_config',
    [
        'name',
        'version',
        'steps_per_mm',
        'gantry_steps_per_mm',
        'acceleration',
        'gantry_calibration',
        'serial_speed',
        'tip_length',
        'default_current',
        'low_current',
        'high_current',
        'default_max_speed',
        'mount_offset',
        'log_level',
        'default_pipette_configs',
        'z_retract_distance',
        'left_mount_offset'
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


def build_fallback_instrument_offset(robot_settings: dict) -> dict:
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


def _build_conf_dict(
        from_conf: Union[Dict, str, None], default) -> Dict[str, float]:
    if not from_conf or isinstance(from_conf, str):
        return default
    else:
        return from_conf


def build_config(deck_cal: List[List[float]],
                 robot_settings: Dict[str, Any]) -> robot_config:
    cfg = robot_config(
        name=robot_settings.get('name', 'Ada Lovelace'),
        version=int(robot_settings.get('version', ROBOT_CONFIG_VERSION)),
        steps_per_mm=_build_conf_dict(
            robot_settings.get('steps_per_mm'), DEFAULT_STEPS_PER_MM),
        gantry_steps_per_mm=_build_conf_dict(
            robot_settings.get('steps_per_mm'), DEFAULT_GANTRY_STEPS_PER_MM),
        acceleration=_build_conf_dict(
            robot_settings.get('acceleration'), DEFAULT_ACCELERATION),
        gantry_calibration=deck_cal or DEFAULT_DECK_CALIBRATION,
        tip_length=robot_settings.get('tip_length', DEFAULT_TIP_LENGTH_DICT),
        mount_offset=robot_settings.get('mount_offset', DEFAULT_MOUNT_OFFSET),
        serial_speed=robot_settings.get('serial_speed', SERIAL_SPEED),
        default_current=robot_settings.get('default_current', DEFAULT_CURRENT),
        low_current=robot_settings.get('low_current', LOW_CURRENT),
        high_current=robot_settings.get('high_current', HIGH_CURRENT),
        default_max_speed=robot_settings.get(
            'default_max_speed', DEFAULT_MAX_SPEEDS),
        log_level=robot_settings.get('log_level', DEFAULT_LOG_LEVEL),
        default_pipette_configs=robot_settings.get(
            'default_pipette_configs', DEFAULT_PIPETTE_CONFIGS),
        z_retract_distance=robot_settings.get(
            'z_retract_distance', Z_RETRACT_DISTANCE),
        left_mount_offset=robot_settings.get(
            'left_mount_offset', DEFAULT_MOUNT_OFFSET),
    )
    return cfg


def config_to_save(
        config: robot_config) -> Tuple[List[List[float]], Dict[str, Any]]:
    converted_config = dict(config._asdict())
    gc = converted_config.pop('gantry_calibration')
    return gc, converted_config


def _determine_calibration_to_use(deck_cal_to_check, api_v1):
    """
    The default calibration loaded in simulation is not
    a valid way to check whether labware exceeds a given
    height. As a workaround, we should load the identity
    matrix with a Z offset if we are not running on a
    robot.
    """
    id_matrix = linal.identity_deck_transform()
    deck_cal_to_use = deck_cal_to_check
    if not config.IS_ROBOT and not api_v1:
        if not deck_cal_to_check:
            deck_cal_to_use = DEFAULT_SIMULATION_CALIBRATION
        elif deck_cal_to_check and\
                array_equal(array(deck_cal_to_check), id_matrix):
            deck_cal_to_use = deck_cal_to_check
    return deck_cal_to_use


def load(deck_cal_file=None, api_v1=False):
    deck_cal_file = deck_cal_file or CONFIG['deck_calibration_file']
    log.debug("Loading deck calibration from {}".format(deck_cal_file))
    current_deck_cal = _load_json(deck_cal_file).get('gantry_calibration', {})
    deck_cal = _determine_calibration_to_use(current_deck_cal, api_v1)
    settings_file = CONFIG['robot_settings_file']
    log.debug("Loading robot settings from {}".format(settings_file))
    robot_settings = _load_json(settings_file) or {}
    return build_config(deck_cal, robot_settings)


def save_deck_calibration(config: robot_config, dc_filename=None, tag=None):
    cal_lists, _ = config_to_save(config)

    dc_filename = dc_filename or CONFIG['deck_calibration_file']
    if tag:
        root, ext = os.path.splitext(dc_filename)
        dc_filename = "{}-{}{}".format(root, tag, ext)
    deck_calibration = {
        'gantry_calibration': cal_lists}
    _save_json(deck_calibration, filename=dc_filename)


def save_robot_settings(config: robot_config, rs_filename=None, tag=None):
    _, config_dict = config_to_save(config)
    # Save everything else in a different file
    rs_filename = rs_filename or CONFIG['robot_settings_file']
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
        _clear_file(CONFIG['deck_calibration_file'])
    if robot:
        _clear_file(CONFIG['robot_settings_file'])


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
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w') as file:
            json.dump(data, file, sort_keys=True, indent=4)
            file.flush()
            os.fsync(file.fileno())
        return data
    except OSError:
        log.exception('Write failed with exception:')
