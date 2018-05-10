import os
import json
from collections import namedtuple
from opentrons.config import get_config_index

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


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
        'tip_length'  # TODO (andy): remove from pipette, move to tip-rack
    ]
)


def _load_config_from_file(pipette_model: str) -> pipette_config:
    config_file = pipette_config_path()
    if os.path.exists(config_file):
        with open(config_file) as conf:
            all_configs = json.load(conf)
            cfg = all_configs[pipette_model]
            res = pipette_config(
                plunger_positions={
                    'top': cfg['plungerPositions']['top'],
                    'bottom': cfg['plungerPositions']['bottom'],
                    'blow_out': cfg['plungerPositions']['blowOut'],
                    'drop_tip': cfg['plungerPositions']['dropTip']
                },
                pick_up_current=cfg['pickUpCurrent'],
                aspirate_flow_rate=cfg['aspirateFlowRate'],
                dispense_flow_rate=cfg['dispenseFlowRate'],
                ul_per_mm=cfg['ulPerMm'],
                channels=cfg['channels'],
                name=pipette_model,
                model_offset=cfg['modelOffset'],
                tip_length=cfg['tipLength']
            )
    else:
        res = None
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
    tip_length=40
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
    tip_length=40
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
    tip_length=60
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
    tip_length=60
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
    tip_length=60
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
    tip_length=60
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
    tip_length=60
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
    cfg = _load_config_from_file(model)
    if not cfg:
        cfg = fallback_configs.get(model)
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
