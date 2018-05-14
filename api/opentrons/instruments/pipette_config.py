import logging
import os
import json
from collections import namedtuple
from opentrons.config import get_config_index

FILE_DIR = os.path.abspath(os.path.dirname(__file__))

log = logging.getLogger(__name__)


def pipette_config_path():
    index = get_config_index()
    return index.get('pipetteConfigFile', './settings.json')


pipette_config = namedtuple(
    'pipette_config',
    [
        'plunger_positions',
        'pick_up_current',
        'aspirate_flow_rate',
        'dispense_flow_rate',
        'ul_per_mm',
        'channels',
        'name',
        'model_offset',
        'plunger_current',
        'drop_tip_current',
        'tip_length'  # TODO (andy): remove from pipette, move to tip-rack
    ]
)


def _load_config_from_file(pipette_model: str, fallback) -> pipette_config:

    def _json_key_to_config_attribute(key) -> str:
        '''
        Converts the JSON key syntax (eg: "plungerPositions"), to the format
        used in the namedtuple `plunger_config` (eg: "plunger_positions")
        '''
        return ''.join([
                '_{}'.format(c.lower()) if c.isupper() else c
                for c in key
            ])

    def _load_config_value(config_json, key) -> pipette_config:
        '''
        Retrieves a given key from the loaded JSON config dict. If that key is
        not present in the dictionary, it falls back to the value from
        the namedtuple `plunger_config`, named "fallback"
        '''
        nonlocal fallback
        fallback_key = _json_key_to_config_attribute(key)
        fallback_value = getattr(fallback, fallback_key)
        return config_json.get(key, fallback_value)

    config_file = pipette_config_path()
    res = None
    if os.path.exists(config_file):
        with open(config_file) as conf:
            try:
                all_configs = json.load(conf)
                cfg = all_configs[pipette_model]
                plunger_pos = _load_config_value(cfg, 'plungerPositions')
                res = pipette_config(
                    plunger_positions={
                        'top': plunger_pos['top'],
                        'bottom': plunger_pos['bottom'],
                        'blow_out': plunger_pos['blowOut'],
                        'drop_tip': plunger_pos['dropTip']
                    },
                    pick_up_current=_load_config_value(cfg, 'pickUpCurrent'),
                    aspirate_flow_rate=_load_config_value(
                        cfg, 'aspirateFlowRate'),
                    dispense_flow_rate=_load_config_value(
                        cfg, 'dispenseFlowRate'),
                    ul_per_mm=_load_config_value(cfg, 'ulPerMm'),
                    channels=_load_config_value(cfg, 'channels'),
                    name=pipette_model,
                    model_offset=_load_config_value(cfg, 'modelOffset'),
                    plunger_current=_load_config_value(cfg, 'plungerCurrent'),
                    drop_tip_current=_load_config_value(cfg, 'dropTipCurrent'),
                    tip_length=_load_config_value(cfg, 'tipLength')
                )
            except (KeyError, json.decoder.JSONDecodeError) as e:
                log.error('Error when loading pipette config: {}'.format(e))
    return res


# ------------------------- deprecated data ---------------------------
# This section is left in as a fall-back until the settings file is
# available on all robots. Currently, getting the settings file onto
# the robots requires a Resin push, which involves some pain to users
# because it restarts the robot--even if a protocol run is in progress.
# The preferred solution is to implement a server endpoint that will
# accept a data packet and save it in the robot, the same way that API
# server updates are currently done. Once that is in place, the app can
# ship the required data to the robot and this fallback data can be
# removed from server code. Delete from here to "end deprecated data"
# below, and remove the `select_config` call from the `config` dict
# comprehension.
DISTANCE_BETWEEN_NOZZLES = 9
NUM_MULTI_CHANNEL_NOZZLES = 8
MULTI_LENGTH = (NUM_MULTI_CHANNEL_NOZZLES - 1) * DISTANCE_BETWEEN_NOZZLES
Y_OFFSET_MULTI = MULTI_LENGTH / 2
Z_OFFSET_MULTI = -25.8

Z_OFFSET_P10 = -13  # longest single-channel pipette
Z_OFFSET_P50 = 0
Z_OFFSET_P300 = 0
Z_OFFSET_P1000 = 20  # shortest single-channel pipette

DEFAULT_ASPIRATE_SECONDS = 2
DEFAULT_DISPENSE_SECONDS = 1

# TODO (ben 20180511): should we read these values from
# TODO                 /shared-data/robot-data/pipette-config.json ? Unclear,
# TODO                 because this is the backup in case that behavior fails,
# TODO                 but we could make it more reliable if we start bundling
# TODO                 config data into the wheel file perhaps. Needs research.
p10_single = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 3,
        'blow_out': 1,
        'drop_tip': -5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=10 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=10 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=0.77,
    channels=1,
    name='p10_single_v1',
    model_offset=(0.0, 0.0, Z_OFFSET_P10),
    plunger_current=0.3,
    drop_tip_current=0.5,
    tip_length=33
)

p10_multi = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 3,
        'blow_out': 1,
        'drop_tip': -5
    },
    pick_up_current=0.2,
    aspirate_flow_rate=10 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=10 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=0.77,
    channels=8,
    name='p10_multi_v1',
    model_offset=(0.0, Y_OFFSET_MULTI, Z_OFFSET_MULTI),
    plunger_current=0.5,
    drop_tip_current=0.5,
    tip_length=33
)

p50_single = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 4,
        'blow_out': 2,
        'drop_tip': -2.5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=50 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=50 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=3.35,
    channels=1,
    name='p50_single_v1',
    model_offset=(0.0, 0.0, Z_OFFSET_P50),
    plunger_current=0.3,
    drop_tip_current=0.5,
    tip_length=51.7
)

p50_multi = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 4,
        'blow_out': 2,
        'drop_tip': -4
    },
    pick_up_current=0.3,
    aspirate_flow_rate=50 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=50 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=3.35,
    channels=8,
    name='p50_multi_v1',
    model_offset=(0.0, Y_OFFSET_MULTI, Z_OFFSET_MULTI),
    plunger_current=0.5,
    drop_tip_current=0.5,
    tip_length=51.7
)

p300_single = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 2.5,
        'blow_out': 1,
        'drop_tip': -2.5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=300 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=300 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=18.7,
    channels=1,
    name='p300_single_v1',
    model_offset=(0.0, 0.0, Z_OFFSET_P300),
    plunger_current=0.3,
    drop_tip_current=0.5,
    tip_length=51.7
)

p300_multi = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 3,
        'blow_out': 1,
        'drop_tip': -4
    },
    pick_up_current=0.3,
    aspirate_flow_rate=300 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=300 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=19,
    channels=8,
    name='p300_multi_v1',
    model_offset=(0.0, Y_OFFSET_MULTI, Z_OFFSET_MULTI),
    plunger_current=0.5,
    drop_tip_current=0.5,
    tip_length=51.7
)

p1000_single = pipette_config(
    plunger_positions={
        'top': 19,
        'bottom': 3,
        'blow_out': 1,
        'drop_tip': -2.5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=1000 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=1000 / DEFAULT_DISPENSE_SECONDS,
    ul_per_mm=65,
    channels=1,
    name='p1000_single_v1',
    model_offset=(0.0, 0.0, Z_OFFSET_P1000),
    plunger_current=0.5,
    drop_tip_current=0.5,
    tip_length=76.7
)

fallback_configs = {
    'p10_single_v1': p10_single,
    'p10_multi_v1': p10_multi,
    'p50_single_v1': p50_single,
    'p50_multi_v1': p50_multi,
    'p300_single_v1': p300_single,
    'p300_multi_v1': p300_multi,
    'p1000_single_v1': p1000_single
}


def select_config(model: str):
    fallback_cfg = fallback_configs.get(model)
    cfg = _load_config_from_file(model, fallback_cfg)
    if not cfg:
        return fallback_cfg
    else:
        return cfg
# ----------------------- end deprecated data -------------------------


# Notes:
# - multi-channel pipettes share the same dimensional offsets
# - single-channel pipettes have different lengths
# - Default number of seconds to aspirate/dispense a pipette's full volume,
#     and these times were chosen to mimic normal human-pipetting motions.
#     However, accurate speeds are dependent on environment (ex: liquid
#     viscosity), therefore a pipette's flow-rates (ul/sec) should be set by
#     protocol writer


# model-specific ID's, saved with each Pipette's memory
# used to identifiy what model pipette is currently connected to machine
PIPETTE_MODEL_IDENTIFIERS = {
    'single': {
        '10': 'p10_single_v1',
        '50': 'p50_single_v1',
        '300': 'p300_single_v1',
        '1000': 'p1000_single_v1'
    },
    'multi': {
        '10': 'p10_multi_v1',
        '50': 'p50_multi_v1',
        '300': 'p300_multi_v1',
    }
}


configs = {
    model: select_config(model)
    for model in [
        'p10_single_v1',
        'p10_multi_v1',
        'p50_single_v1',
        'p50_multi_v1',
        'p300_single_v1',
        'p300_multi_v1',
        'p1000_single_v1']}


def load(pipette_model: str) -> pipette_config:
    """
    Lazily loads pipette config data from disk. This means that changes to the
    configuration data should be picked up on newly instantiated objects
    without requiring a restart. If :param pipette_model is not in the top-
    level keys of the "pipette-config.json" file, this function will raise a
    KeyError
    :param pipette_model: a pipette model string corresponding to a top-level
        key in the "pipette-config.json" file
    :return: a `pipette_config` instance
    """
    return select_config(pipette_model)
