import typing
import datetime
import time
from pathlib import Path

from opentrons.protocol_api.util import first_parent
from opentrons.config import get_opentrons_path, get_tip_length_cal_path

from . import (
    file_operators as io,
    encoder_decoder as ed,
    types as local_types,
    helpers)

if typing.TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware
    from opentrons.types import Point

OFFSETS_PATH = get_opentrons_path('labware_calibration_offsets_dir_v2')


def _add_to_index_offset_file(labware: 'Labware', lw_hash: str):
    """
    A helper method to create or add to an index file so that calibration
    files can be looked up by their hash to reveal the labware uri and
    parent information of a given file.

    :param labware: A labware object
    :param lw_hash: The labware hash of the calibration
    """
    index_file = OFFSETS_PATH / 'index.json'
    uri = labware.uri
    if index_file.exists():
        blob = io._read_file(str(index_file))
    else:
        blob = {}

    mod_parent = helpers._get_parent_identifier(labware.parent)
    slot = first_parent(labware)
    if mod_parent:
        mod_dict = {
            'parent': mod_parent,
            'fullParent': f'{slot}-{mod_parent}'}
    else:
        mod_dict = {}
    full_id = f'{lw_hash}{mod_parent}'
    blob[full_id] = {
            "uri": f'{uri}',
            "slot": full_id,
            "module": mod_dict
        }
    io.save_to_file(index_file, blob)


def save_calibration(labware: 'Labware', delta: 'Point'):
    """
    Function to be used whenever an updated delta is found for the first well
    of a given labware. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the delta and the lastModified fields under the "default" key.
    """
    labware_offset_path =\
        helpers._get_labware_offset_path(labware, OFFSETS_PATH)
    labware_hash = helpers._hash_labware_def(labware._definition)
    _add_to_index_offset_file(labware, labware_hash)
    calibration_data = _helper_offset_data_format(
        str(labware_offset_path), delta)
    io.save_to_file(labware_offset_path, calibration_data)
    labware.set_calibration(delta)


def create_tip_length_data(
        labware: 'Labware',
        length: float) -> local_types.PipTipLengthCalibration:
    assert labware._is_tiprack, \
        'cannot save tip length for non-tiprack labware'
    parent_id = helpers._get_parent_identifier(labware.parent)
    labware_hash = helpers._hash_labware_def(labware._definition)

    tip_length_data: local_types.TipLengthCalibration = {
        'tipLength': length,
        'lastModified': datetime.datetime.utcnow()
    }

    data = {labware_hash + parent_id: tip_length_data}
    return data


def _helper_offset_data_format(filepath: str, delta: 'Point') -> dict:
    if not Path(filepath).is_file():
        calibration_data = {
            "default": {
                "offset": [delta.x, delta.y, delta.z],
                "lastModified": time.time()
            }
        }
    else:
        calibration_data = io._read_file(filepath)
        calibration_data['default']['offset'] = [delta.x, delta.y, delta.z]
        calibration_data['default']['lastModified'] = time.time()
    return calibration_data


def _append_to_index_tip_length_file(pip_id: str, lw_hash: str):
    index_file = get_tip_length_cal_path()/'index.json'
    try:
        index_data = io._read_file(str(index_file))
    except FileNotFoundError:
        index_data = {}

    if lw_hash not in index_data:
        index_data[lw_hash] = [pip_id]
    elif pip_id not in index_data[lw_hash]:
        index_data[lw_hash].append(pip_id)

    io.save_to_file(index_file, index_data)


def save_tip_length_calibration(
        pip_id: str, tip_length_cal: local_types.PipTipLengthCalibration):
    tip_length_dir_path = get_tip_length_cal_path()
    tip_length_dir_path.mkdir(parents=True, exist_ok=True)
    pip_tip_length_path = tip_length_dir_path/f'{pip_id}.json'

    for lw_hash in tip_length_cal.keys():
        _append_to_index_tip_length_file(pip_id, lw_hash)

    try:
        tip_length_data = io._read_cal_file(str(pip_tip_length_path))
    except FileNotFoundError:
        tip_length_data = {}

    tip_length_data.update(tip_length_cal)

    io.save_to_file(pip_tip_length_path, tip_length_data, ed.DateTimeEncoder)
