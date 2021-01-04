from copy import deepcopy
import json
import logging
import os
from dataclasses import asdict
from pathlib import Path

from typing import Any, Dict, List, Union, Optional, TypeVar, cast

from opentrons.config import CONFIG
from opentrons.hardware_control.types import BoardRevision
from .types import CurrentDict, RobotConfig, AxisDict

log = logging.getLogger(__name__)

ROBOT_CONFIG_VERSION = 4

PLUNGER_CURRENT_LOW = 0.05
PLUNGER_CURRENT_HIGH = 0.05

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 0.8

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.25

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.25

XY_CURRENT_LOW_REFRESH = 0.7
MOUNT_CURRENT_HIGH_REFRESH = 0.5

Z_RETRACT_DISTANCE = 2

HIGH_CURRENT: CurrentDict = {
    'default': {
        'X': X_CURRENT_HIGH,
        'Y': Y_CURRENT_HIGH,
        'Z': MOUNT_CURRENT_HIGH_REFRESH,
        'A': MOUNT_CURRENT_HIGH_REFRESH,
        'B': PLUNGER_CURRENT_HIGH,
        'C': PLUNGER_CURRENT_HIGH
    },
    '2.1': {
        'X': X_CURRENT_HIGH,
        'Y': Y_CURRENT_HIGH,
        'Z': MOUNT_CURRENT_HIGH,
        'A': MOUNT_CURRENT_HIGH,
        'B': PLUNGER_CURRENT_HIGH,
        'C': PLUNGER_CURRENT_HIGH
    }
}

LOW_CURRENT: CurrentDict = {
    'default': {
        'X': XY_CURRENT_LOW_REFRESH,
        'Y': XY_CURRENT_LOW_REFRESH,
        'Z': MOUNT_CURRENT_LOW,
        'A': MOUNT_CURRENT_LOW,
        'B': PLUNGER_CURRENT_LOW,
        'C': PLUNGER_CURRENT_LOW
    },
    '2.1': {
        'X': X_CURRENT_LOW,
        'Y': Y_CURRENT_LOW,
        'Z': MOUNT_CURRENT_LOW,
        'A': MOUNT_CURRENT_LOW,
        'B': PLUNGER_CURRENT_LOW,
        'C': PLUNGER_CURRENT_LOW
    }
}

DEFAULT_CURRENT: CurrentDict = {
    'default': {
        'X': HIGH_CURRENT['default']['X'],
        'Y': HIGH_CURRENT['default']['Y'],
        'Z': HIGH_CURRENT['default']['Z'],
        'A': HIGH_CURRENT['default']['A'],
        'B': LOW_CURRENT['default']['B'],
        'C': LOW_CURRENT['default']['C']
    },
    '2.1': {
        'X': HIGH_CURRENT['2.1']['X'],
        'Y': HIGH_CURRENT['2.1']['Y'],
        'Z': HIGH_CURRENT['2.1']['Z'],
        'A': HIGH_CURRENT['2.1']['A'],
        'B': LOW_CURRENT['2.1']['B'],
        'C': LOW_CURRENT['2.1']['C']
    }
}

X_MAX_SPEED = 600
Y_MAX_SPEED = 400
Z_MAX_SPEED = 125
A_MAX_SPEED = 125
B_MAX_SPEED = 40
C_MAX_SPEED = 40

DEFAULT_MAX_SPEEDS: AxisDict = {
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


DEFAULT_MOUNT_OFFSET = [-34, 0, 0]
DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]
SERIAL_SPEED = 115200
DEFAULT_LOG_LEVEL = 'INFO'


def _build_hw_versioned_current_dict(
        from_conf: Optional[Dict[str, Any]], default: CurrentDict) -> CurrentDict:
    if not from_conf or not isinstance(from_conf, dict):
        return default
    # special case: if this is a valid old (i.e. not model-specific) current
    # setup, migrate it.
    if 'default' not in from_conf and not (set('XYZABC')-set(from_conf.keys())):
        new_dct = deepcopy(default)
        # Because there's no case in which a machine with a more recent revision
        # than 2.1 should have a valid and edited robot config when updating
        # to this code, we should default it to 2.1 to avoid breaking other
        # robots
        new_dct['2.1'] = cast(AxisDict, from_conf)
        return new_dct
    return cast(CurrentDict, from_conf)


DictType = TypeVar('DictType', bound=Dict)


def _build_dict_with_default(
        from_conf: Union[DictType, str, None], default: DictType) -> DictType:
    if not isinstance(from_conf, dict):
        return default
    else:
        return cast(DictType, from_conf)


def current_for_revision(
        current_dict: CurrentDict,
        revision: BoardRevision) -> AxisDict:
    if revision == BoardRevision.UNKNOWN:
        return current_dict.get('2.1', current_dict['default'])
    elif revision.real_name() in current_dict:
        return current_dict[revision.real_name()]  # type: ignore
    else:
        return current_dict['default']


def build_config(robot_settings: Dict[str, Any]) -> RobotConfig:
    return RobotConfig(
        name=robot_settings.get('name', 'Ada Lovelace'),
        version=ROBOT_CONFIG_VERSION,
        gantry_steps_per_mm=_build_dict_with_default(
            robot_settings.get('steps_per_mm'), DEFAULT_GANTRY_STEPS_PER_MM),
        acceleration=_build_dict_with_default(
            robot_settings.get('acceleration'), DEFAULT_ACCELERATION),
        serial_speed=robot_settings.get('serial_speed', SERIAL_SPEED),
        default_current=_build_hw_versioned_current_dict(
            robot_settings.get('default_current'), DEFAULT_CURRENT),
        low_current=_build_hw_versioned_current_dict(
            robot_settings.get('low_current'), LOW_CURRENT),
        high_current=_build_hw_versioned_current_dict(
            robot_settings.get('high_current'), HIGH_CURRENT),
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


def config_to_save(
        config: RobotConfig) -> Dict[str, Any]:
    return asdict(config)


def load() -> RobotConfig:
    settings_file = CONFIG['robot_settings_file']
    log.debug("Loading robot settings from {}".format(settings_file))
    robot_settings = _load_json(settings_file) or {}
    return build_config(robot_settings)


def save_robot_settings(config: RobotConfig,
                        rs_filename: str = None,
                        tag: str = None):
    config_dict = config_to_save(config)

    # Save everything else in a different file
    filename = rs_filename or CONFIG['robot_settings_file']
    if tag:
        root, ext = os.path.splitext(filename)
        filename = "{}-{}{}".format(root, tag, ext)
    _save_json(config_dict, filename=filename)

    return config_dict


def backup_configuration(config: RobotConfig, tag: str = None) -> None:
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


def clear() -> None:
    _clear_file(CONFIG['robot_settings_file'])


def _clear_file(filename: Union[str, Path]) -> None:
    log.debug('Deleting {}'.format(filename))
    if os.path.exists(filename):
        os.remove(filename)


# TODO: move to util (write a default load, save JSON function)
def _load_json(filename: Union[str, Path]) -> Dict[str, Any]:
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


def _save_json(data: Dict[str, Any], filename: Union[str, Path]) -> None:
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w') as file:
            json.dump(data, file, sort_keys=True, indent=4)
            file.flush()
            os.fsync(file.fileno())
    except OSError:
        log.exception('Write failed with exception:')
