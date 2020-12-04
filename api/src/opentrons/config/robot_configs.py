from collections import namedtuple
import json
import logging
import os

from typing import Any, Dict, List, NamedTuple, Union, Optional

from opentrons.config import CONFIG

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
        'serial_speed',
        'tip_length',
        'default_current',
        'low_current',
        'high_current',
        'default_max_speed',
        'log_level',
        'default_pipette_configs',
        'z_retract_distance',
        'left_mount_offset'
    ]
)


def _build_conf_dict(
        from_conf: Union[Dict, str, None], default) -> Dict[str, float]:
    if not from_conf or isinstance(from_conf, str):
        return default
    else:
        return from_conf


def build_config(robot_settings: Dict[str, Any]) -> robot_config:
    cfg = robot_config(
        name=robot_settings.get('name', 'Ada Lovelace'),
        version=int(robot_settings.get('version', ROBOT_CONFIG_VERSION)),
        steps_per_mm=_build_conf_dict(
            robot_settings.get('steps_per_mm'), DEFAULT_STEPS_PER_MM),
        gantry_steps_per_mm=_build_conf_dict(
            robot_settings.get('steps_per_mm'), DEFAULT_GANTRY_STEPS_PER_MM),
        acceleration=_build_conf_dict(
            robot_settings.get('acceleration'), DEFAULT_ACCELERATION),
        tip_length=robot_settings.get('tip_length', DEFAULT_TIP_LENGTH_DICT),
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
        config: robot_config) -> Dict[str, Any]:
    return dict(config._asdict())


def load():
    settings_file = CONFIG['robot_settings_file']
    log.debug("Loading robot settings from {}".format(settings_file))
    robot_settings = _load_json(settings_file) or {}
    return build_config(robot_settings)


def save_robot_settings(config: robot_config, rs_filename=None, tag=None):
    config_dict = config_to_save(config)

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
    save_robot_settings(config, tag=tag)


def get_legacy_gantry_calibration() -> Optional[List[List[float]]]:
    """
    Returns the legacy gantry calibration if exists.

    This should happen only if the new deck calibration file does not exist.
    The legacy calibration should then be migrated to the new format.
    """
    gantry_cal = _load_json(CONFIG['deck_calibration_file'])
    if 'gantry_calibration' in gantry_cal:
        return gantry_cal['gantry_calibration']
    else:
        return None


def clear():
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
