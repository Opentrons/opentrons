import os
import json
from collections import namedtuple


FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def config_dir():
    return os.environ.get(
        'OT_SETTINGS_DIR',
        os.path.abspath(os.path.join(
            FILE_DIR, '..', '..', '..', 'labware-definitions', 'robot-data')))


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
    with open(os.path.join(config_dir(), 'pipette-config.json')) as conf:
        all_configs = json.load(conf)
        cfg = all_configs[pipette_model]
        return pipette_config(
            plunger_positions={
                'top': cfg['plunger-positions']['top'],
                'bottom': cfg['plunger-positions']['bottom'],
                'blow_out': cfg['plunger-positions']['blow-out'],
                'drop_tip': cfg['plunger-positions']['drop-tip']
            },
            pick_up_current=cfg['pick-up-current'],
            aspirate_flow_rate=cfg['aspirate-flow-rate'],
            dispense_flow_rate=cfg['dispense-flow-rate'],
            ul_per_mm=cfg['ul-per-mm'],
            channels=cfg['channels'],
            name=pipette_model,
            model_offset=cfg['model-offset'],
            tip_length=cfg['tip-length']
        )

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
    model: _load_config_from_file(model)
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
    return _load_config_from_file(pipette_model)
