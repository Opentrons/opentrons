import copy
import logging
import json
import numbers
from collections import namedtuple
from typing import Any, Dict, List, Union, Tuple, Sequence, Optional

from opentrons.config import feature_flags as ff, CONFIG
from opentrons.system.shared_data import load_shared_data


log = logging.getLogger(__name__)

pipette_config = namedtuple(
    'pipette_config',
    [
        'top',
        'bottom',
        'blow_out',
        'drop_tip',
        'pick_up_current',
        'pick_up_distance',
        'pick_up_increment',
        'pick_up_presses',
        'pick_up_speed',
        'aspirate_flow_rate',
        'dispense_flow_rate',
        'channels',
        'model_offset',
        'plunger_current',
        'drop_tip_current',
        'drop_tip_speed',
        'min_volume',
        'max_volume',
        'ul_per_mm',
        'quirks',
        'tip_length',  # TODO (andy): remove from pipette, move to tip-rack
        'tip_overlap',  # TODO: Replace entirely with tip length calibration
        'display_name',
        'name',
        'back_compat_names',
        'return_tip_height',
        'blow_out_flow_rate',
        'max_travel',
        'home_position',
        'steps_per_mm',
        'idle_current'
    ]
)

# Notes:
# - multi-channel pipettes share the same dimensional offsets
# - single-channel pipettes have different lengths
# - Default number of seconds to aspirate/dispense a pipette's full volume,
#     and these times were chosen to mimic normal human-pipetting motions.
#     However, accurate speeds are dependent on environment (ex: liquid
#     viscosity), therefore a pipette's flow-rates (ul/sec) should be set by
#     protocol writer

# Multi-channel y offset caluclations:
DISTANCE_BETWEEN_NOZZLES = 9
NUM_MULTI_CHANNEL_NOZZLES = 8
MULTI_LENGTH = (NUM_MULTI_CHANNEL_NOZZLES - 1) * DISTANCE_BETWEEN_NOZZLES
Y_OFFSET_MULTI = MULTI_LENGTH / 2
Z_OFFSET_MULTI = -25.8

Z_OFFSET_P10 = -13  # longest single-channel pipette
Z_OFFSET_P50 = 0
Z_OFFSET_P300 = 0
Z_OFFSET_P1000 = 20  # shortest single-channel pipette

LOW_CURRENT_DEFAULT = 0.05


def model_config() -> Dict[str, Any]:
    """ Load the per-pipette-model config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteModelSpecs.json')
        or '{}')


def name_config() -> Dict[str, Any]:
    """ Load the per-pipette-name config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteNameSpecs.json')
        or '{}')


config_models = list(model_config()['config'].keys())
config_names = list(name_config().keys())
configs = model_config()['config']
#: A list of pipette model names for which we have config entries
MUTABLE_CONFIGS = model_config()['mutableConfigs']
#: A list of mutable configs for pipettes
VALID_QUIRKS = model_config()['validQuirks']
#: A list of valid quirks for pipettes


def name_for_model(pipette_model: str) -> str:
    return configs[pipette_model]['name']


def load(pipette_model: str, pipette_id: str = None) -> pipette_config:
    """
    Load pipette config data


    This function loads from a combination of

    - the pipetteModelSpecs.json file in the wheel (should never be edited)
    - the pipetteNameSpecs.json file in the wheel (should never be edited)
    - any config overrides found in
      ``opentrons.config.CONFIG['pipette_config_overrides_dir']``

    This function reads from disk each time, so changes to the overrides
    will be picked up in subsequent calls.

    :param str pipette_model: The pipette model name (i.e. "p10_single_v1.3")
                              for which to load configuration
    :param pipette_id: An (optional) unique ID for the pipette to locate
                       config overrides. If the ID is not specified, the system
                       assumes this is a simulated pipette and does not
                       save settings. If the ID is specified but no overrides
                       corresponding to the ID are found, the system creates a
                       new overrides file for it.
    :type pipette_id: str or None
    :raises KeyError: if ``pipette_model`` is not in the top-level keys of
                      the pipetteModelSpecs.json file (and therefore not in
                      :py:attr:`configs`)

    :returns pipette_config: The configuration, loaded and checked
    """

    # Load the model config and update with the name config
    cfg = copy.deepcopy(configs[pipette_model])
    cfg.update(copy.deepcopy(name_config()[cfg['name']]))
    # Load overrides if we have a pipette id
    if pipette_id:
        try:
            override = load_overrides(pipette_id)
            if 'quirks' in override.keys():
                override['quirks'] = [
                    qname for qname, qval in override['quirks'].items()
                    if qval]
        except FileNotFoundError:
            save_overrides(pipette_id, {}, pipette_model)
            log.info(
                "Save defaults for pipette model {} and id {}".format(
                    pipette_model, pipette_id))
        else:
            cfg.update(override)

    # the ulPerMm functions are structured in pipetteModelSpecs.json as
    # a list sorted from oldest to newest. That means the latest functions
    # are always the last element and, as of right now, the older ones are
    # the first element (for models that only have one function, the first
    # and last elements are the same, which is fine). If we add more in the
    # future, we’ll have to change this code to select items more
    # intelligently
    if ff.use_old_aspiration_functions():
        log.debug("Using old aspiration functions")
        ul_per_mm = cfg['ulPerMm'][0]
    else:
        ul_per_mm = cfg['ulPerMm'][-1]

    smoothie_configs = cfg['smoothieConfigs']
    res = pipette_config(
        top=ensure_value(
            cfg, 'top', MUTABLE_CONFIGS),
        bottom=ensure_value(
            cfg, 'bottom', MUTABLE_CONFIGS),
        blow_out=ensure_value(
            cfg, 'blowout', MUTABLE_CONFIGS),
        drop_tip=ensure_value(
            cfg, 'dropTip', MUTABLE_CONFIGS),
        pick_up_current=ensure_value(cfg, 'pickUpCurrent', MUTABLE_CONFIGS),
        pick_up_distance=ensure_value(cfg, 'pickUpDistance', MUTABLE_CONFIGS),
        pick_up_increment=ensure_value(
            cfg, 'pickUpIncrement', MUTABLE_CONFIGS),
        pick_up_presses=ensure_value(cfg, 'pickUpPresses', MUTABLE_CONFIGS),
        pick_up_speed=ensure_value(cfg, 'pickUpSpeed', MUTABLE_CONFIGS),
        aspirate_flow_rate=ensure_value(
            cfg, 'defaultAspirateFlowRate', MUTABLE_CONFIGS),
        dispense_flow_rate=ensure_value(
            cfg, 'defaultDispenseFlowRate', MUTABLE_CONFIGS),
        channels=ensure_value(cfg, 'channels', MUTABLE_CONFIGS),
        model_offset=ensure_value(cfg, 'modelOffset', MUTABLE_CONFIGS),
        plunger_current=ensure_value(cfg, 'plungerCurrent', MUTABLE_CONFIGS),
        drop_tip_current=ensure_value(cfg, 'dropTipCurrent', MUTABLE_CONFIGS),
        drop_tip_speed=ensure_value(cfg, 'dropTipSpeed', MUTABLE_CONFIGS),
        min_volume=ensure_value(cfg, 'minVolume', MUTABLE_CONFIGS),
        max_volume=ensure_value(cfg, 'maxVolume', MUTABLE_CONFIGS),
        ul_per_mm=ul_per_mm,
        quirks=validate_quirks(ensure_value(cfg, 'quirks', MUTABLE_CONFIGS)),
        tip_overlap=cfg['tipOverlap'],
        tip_length=ensure_value(cfg, 'tipLength', MUTABLE_CONFIGS),
        display_name=ensure_value(cfg, 'displayName', MUTABLE_CONFIGS),
        name=cfg.get('name'),
        back_compat_names=cfg.get('backCompatNames', []),
        return_tip_height=cfg.get('returnTipHeight', 0.5),
        blow_out_flow_rate=ensure_value(
            cfg, 'defaultBlowOutFlowRate', MUTABLE_CONFIGS),
        max_travel=smoothie_configs['travelDistance'],
        home_position=smoothie_configs['homePosition'],
        steps_per_mm=smoothie_configs['stepsPerMM'],
        idle_current=cfg.get('idleCurrent', LOW_CURRENT_DEFAULT)
    )

    return res


def piecewise_volume_conversion(
        ul: float, sequence: List[List[float]]) -> float:
    """
    Takes a volume in microliters and a sequence representing a piecewise
    function for the slope and y-intercept of a ul/mm function, where each
    sub-list in the sequence contains:

      - the max volume for the piece of the function (minimum implied from the
        max of the previous item or 0
      - the slope of the segment
      - the y-intercept of the segment

    :return: the ul/mm value for the specified volume
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    i = list(filter(lambda x: ul <= x[0], sequence))[0]
    # use that element to calculate the movement distance in mm
    return i[1]*ul + i[2]


TypeOverrides = Dict[str, Union[float, bool, None]]


def validate_overrides(data: TypeOverrides,
                       config_model: Dict) -> None:
    """
    Check that override fields are valid.

    :param data: a dict of field name to value
    :param config_model: the configuration for the chosen model
    :raises ValueError: If a value is invalid
    """
    for key, value in data.items():
        field_config = config_model.get(key)
        is_quirk = key in config_model['quirks']

        if is_quirk:
            # If it's a quirk it must be a bool or None
            if value is not None and not isinstance(value, bool):
                raise ValueError(f'{value} is invalid for {key}')
        elif not field_config:
            # If it's not a quirk we must have a field config
            raise ValueError(f'Unknown field {key}')
        elif value is not None:
            # If value is not None it must be numeric and between min and max
            if not isinstance(value, numbers.Number):
                raise ValueError(f'{value} is invalid for {key}')
            elif value < field_config['min'] or value > field_config['max']:
                raise ValueError(f'{key} out of range with {value}')


def override(pipette_id: str, fields: TypeOverrides):
    """
    Override configuration for pipette. Validate then save.

    :param pipette_id: The pipette id
    :param fields: Dict of field name to override value
    """
    config_match = list_mutable_configs(pipette_id)
    whole_config = load_config_dict(pipette_id)
    validate_overrides(data=fields, config_model=config_match)
    save_overrides(pipette_id, fields, whole_config.get('model'))


def save_overrides(pipette_id: str,
                   overrides: TypeOverrides,
                   model: Optional[str]):
    """
    Save overrides for the pipette.

    :param pipette_id: The pipette id
    :param overrides: The incoming values
    :param model: The model of pipette
    :return: None
    """
    override_dir = CONFIG['pipette_config_overrides_dir']
    model_configs = configs[model]
    model_configs_quirks = {key: True for key in model_configs['quirks']}
    try:
        existing = load_overrides(pipette_id)
        # Add quirks setting for pipettes already with a pipette id file
        if 'quirks' not in existing.keys():
            existing['quirks'] = model_configs_quirks
    except FileNotFoundError:
        existing = model_configs_quirks

    for key, value in overrides.items():
        # If an existing override is saved as null from endpoint, remove from
        # overrides file
        if value is None:
            if existing.get(key):
                del existing[key]
        elif isinstance(value, bool):
            existing, model_configs = change_quirks(
                {key: value}, existing, model_configs)
        else:
            if not model_configs[key].get('default'):
                model_configs[key]['default'] = model_configs[key]['value']
            model_configs[key]['value'] = value
            existing[key] = model_configs[key]
    assert model in config_models
    existing['model'] = model
    json.dump(existing, (override_dir/f'{pipette_id}.json').open('w'))


def change_quirks(override_quirks, existing, model_configs):
    if not existing.get('quirks'):
        # ensure quirk key exists
        existing['quirks'] = override_quirks
    for quirk, setting in override_quirks.items():
        # setting values again if above case true, but
        # meant for use-cases where we may only be given an update
        # for one setting
        existing['quirks'][quirk] = setting
        if setting not in model_configs['quirks']:
            model_configs['quirks'].append(quirk)
        elif not setting:
            model_configs['quirks'].remove(quirk)
    return existing, model_configs


def load_overrides(pipette_id: str) -> Dict[str, Any]:
    overrides = CONFIG['pipette_config_overrides_dir']
    fi = (overrides/f'{pipette_id}.json').open()
    try:
        return json.load(fi)
    except json.JSONDecodeError as e:
        log.warning(f'pipette override for {pipette_id} is corrupt: {e}')
        (overrides/f'{pipette_id}.json').unlink()
        raise FileNotFoundError(str(overrides/f'{pipette_id}.json'))


def validate_quirks(quirks: List[str]):
    valid_quirks = []
    for quirk in quirks:
        if quirk in VALID_QUIRKS:
            valid_quirks.append(quirk)
        else:
            log.warning(f'{quirk} is not a valid quirk')
    return valid_quirks


def ensure_value(
        config: dict,
        name: Union[str, Tuple[str, ...]],
        mutable_config_list: List[str]):
    """
    Pull value of config data from file. Shape can either be a dictionary with
    a value key -- indicating that it can be changed -- or another
    data structure such as an array.
    """
    if not isinstance(name, tuple):
        path: Tuple[str, ...] = (name,)
    else:
        path = name
    for element in path[:-1]:
        config = config[element]

    value = config[path[-1]]
    if path[-1] != 'quirks' and path[-1] in mutable_config_list:
        value = value['value']
    return value


def known_pipettes() -> Sequence[str]:
    """ List pipette IDs for which we have known overrides """
    return [fi.stem
            for fi in CONFIG['pipette_config_overrides_dir'].iterdir()
            if fi.is_file() and '.json' in fi.suffixes]


def add_default(cfg):
    if isinstance(cfg, dict):
        if 'value' in cfg.keys():
            cfg['default'] = cfg['value']
        else:
            for top_level_key in cfg.keys():
                add_default(cfg[top_level_key])


def load_config_dict(pipette_id: str) -> Dict:
    """ Give updated config with overrides for a pipette. This will add
    the default value for a mutable config before returning the modified
    config value.
    """
    override = load_overrides(pipette_id)
    model = override['model']
    config = copy.deepcopy(model_config()['config'][model])
    config.update(copy.deepcopy(name_config()[config['name']]))

    if 'quirks' not in override.keys():
        override['quirks'] = {key: True for key in config['quirks']}

    for top_level_key in config.keys():
        if top_level_key != 'quirks':
            add_default(config[top_level_key])

    config.update(override)

    return config


def list_mutable_configs(pipette_id: str) -> Dict[str, Any]:
    """
    Returns dict of mutable configs only.
    """
    cfg: Dict[str, Any] = {}

    if pipette_id in known_pipettes():
        config = load_config_dict(pipette_id)
    else:
        log.info(f'Pipette id {pipette_id} not found')
        return cfg

    for key in config:
        if key in MUTABLE_CONFIGS:
            cfg[key] = config[key]
    return cfg
