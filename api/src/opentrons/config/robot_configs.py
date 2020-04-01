from collections import namedtuple
import json
import logging
import os
from typing import Any, Dict, List, NamedTuple, Tuple, Union

from opentrons.config import CONFIG, feature_flags as fflags

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

PLUNGER_CURRENT_LOW = 0.3
PLUNGER_CURRENT_HIGH = 0.05

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 0.8

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.25

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.25


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
        'gantry_steps_per_mm',
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
        'tip_probe',
        'default_pipette_configs'
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


def _tip_probe_settings_with_migration(full_settings):
    new_tp = full_settings.get('tip_probe', {})
    old_tp = full_settings.get('probe_center', {})
    if old_tp:
        new_tp['center'] = old_tp
    elif 'center' not in new_tp:
        new_tp['center'] = _default_probe_center()
    return new_tp


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
        instrument_offset=build_fallback_instrument_offset(robot_settings),
        tip_length=robot_settings.get('tip_length', DEFAULT_TIP_LENGTH_DICT),
        mount_offset=robot_settings.get('mount_offset', DEFAULT_MOUNT_OFFSET),
        serial_speed=robot_settings.get('serial_speed', SERIAL_SPEED),
        default_current=robot_settings.get('default_current', DEFAULT_CURRENT),
        low_current=robot_settings.get('low_current', LOW_CURRENT),
        high_current=robot_settings.get('high_current', HIGH_CURRENT),
        default_max_speed=robot_settings.get(
            'default_max_speed', DEFAULT_MAX_SPEEDS),
        log_level=robot_settings.get('log_level', DEFAULT_LOG_LEVEL),
        tip_probe=_build_tip_probe(
            _tip_probe_settings_with_migration(robot_settings)),
        default_pipette_configs=robot_settings.get(
            'default_pipette_configs', DEFAULT_PIPETTE_CONFIGS)
    )
    return cfg


def config_to_save(
        config: robot_config) -> Tuple[List[List[float]], Dict[str, Any]]:
    top = dict(config._asdict())
    top['tip_probe'] = dict(top['tip_probe']._asdict())
    top['tip_probe']['z_clearance'] = dict(
        top['tip_probe']['z_clearance']._asdict())
    gc = top.pop('gantry_calibration')
    return gc, top


def load(deck_cal_file=None):
    deck_cal_file = deck_cal_file or CONFIG['deck_calibration_file']
    log.debug("Loading deck calibration from {}".format(deck_cal_file))
    deck_cal = _load_json(deck_cal_file).get('gantry_calibration', {})
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


class HotSpot(NamedTuple):
    axis: str
    x_start_offs: float
    y_start_offs: float
    z_start_abs: float
    probe_distance: float


def calculate_tip_probe_hotspots(
        tip_length: float,
        tip_probe_settings: tip_probe_config)\
        -> List[HotSpot]:
    """
    Generate a list of tuples describing motions for doing the xy part of
    tip probe based on the config's description of the tip probe box.
    """
    # probe_dimensions is the external bounding box of the probe unit
    size_x, size_y, size_z = tip_probe_settings.dimensions

    rel_x_start = (size_x / 2) + tip_probe_settings.switch_clearance
    rel_y_start = (size_y / 2) + tip_probe_settings.switch_clearance

    # Ensure that the nozzle will clear the probe unit and tip will clear deck
    nozzle_safe_z = round((size_z - tip_length)
                          + tip_probe_settings.z_clearance.normal, 3)

    z_start = max(tip_probe_settings.z_clearance.deck, nozzle_safe_z)
    switch_offset = tip_probe_settings.switch_offset
    # Each list item defines axis we are probing for, starting position vector
    # and travel distance
    neg_x = HotSpot('x',
                    -rel_x_start,
                    switch_offset[0],
                    z_start,
                    size_x)
    pos_x = HotSpot('x',
                    rel_x_start,
                    switch_offset[0],
                    z_start,
                    -size_x)
    neg_y = HotSpot('y',
                    switch_offset[1],
                    -rel_y_start,
                    z_start,
                    size_y)
    pos_y = HotSpot('y',
                    switch_offset[1],
                    rel_y_start,
                    z_start,
                    -size_y)
    z = HotSpot(
        'z',
        0,
        switch_offset[2],
        tip_probe_settings.center[2] + tip_probe_settings.z_clearance.start,
        -size_z)

    return [
        neg_x,
        pos_x,
        neg_y,
        pos_y,
        z
    ]
