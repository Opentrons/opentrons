""" opentrons.calibration_storage.modify: functions for modifying
calibration storage

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
import typing
from pathlib import Path

from opentrons import config
from opentrons.util.helpers import utc_now

from . import (
    file_operators as io,
    types as local_types,
    helpers,
    migration)

if typing.TYPE_CHECKING:
    from .dev_types import (
        TipLengthCalibration, PipTipLengthCalibration,
        DeckCalibrationData)
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons.types import Point


def _add_to_index_offset_file(parent: str, slot: str, uri: str, lw_hash: str):
    """
    A helper method to create or add to an index file so that calibration
    files can be looked up by their hash to reveal the labware uri and
    parent information of a given file.

    :param parent: A labware object
    :param slot
    :param lw_hash: The labware hash of the calibration
    """
    offset =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    index_file = offset / 'index.json'
    if index_file.exists():
        migration.check_index_version(index_file)
        blob = io.read_cal_file(str(index_file))
    else:
        blob = {}

    full_id = f'{lw_hash}{parent}'
    try:
        blob['data'][full_id]
    except KeyError:
        if parent:
            mod_dict = {
                'parent': parent,
                'fullParent': f'{slot}-{parent}'}
        else:
            mod_dict = {}
        new_index_data = {
            "uri": f'{uri}',
            "slot": full_id,
            "module": mod_dict}
        if blob.get('data'):
            blob['data'][full_id] = new_index_data
        else:
            blob['data'] = {full_id: new_index_data}
        blob['version'] = migration.MAX_VERSION
        io.save_to_file(index_file, blob)


def add_existing_labware_to_index_file(
        definition: 'LabwareDefinition', parent: str = '', slot: str = ''):
    labware_hash = helpers.hash_labware_def(definition)
    uri = helpers.uri_from_definition(definition)
    _add_to_index_offset_file(parent, slot, uri, labware_hash)


def save_labware_calibration(
        labware_path: local_types.StrPath,
        definition: 'LabwareDefinition',
        delta: 'Point',
        slot: str = '',
        parent: str = ''):
    """
    Function to be used whenever an updated delta is found for the first well
    of a given labware. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the delta and the lastModified fields under the "default" key.

    :param labware_path: name of labware offset path
    :param definition: full definition of the labware
    :param delta: point you are saving
    :param slot: slot the labware calibration is associated with
    [not yet implemented so it will currently only be an empty string]
    :param parent: parent of the labware, either a slot or a module.
    """
    offset_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    labware_offset_path = offset_path / labware_path
    labware_hash = helpers.hash_labware_def(definition)
    uri = helpers.uri_from_definition(definition)
    _add_to_index_offset_file(parent, slot, uri, labware_hash)
    calibration_data = _helper_offset_data_format(
        str(labware_offset_path), delta)
    io.save_to_file(labware_offset_path, calibration_data)


def create_tip_length_data(
        definition: 'LabwareDefinition',
        parent: str,
        length: float) -> 'PipTipLengthCalibration':
    """
    Function to correctly format tip length data.

    :param definition: full labware definition
    :param parent: the slot associated with the tiprack
    [not yet implemented, so it is always an empty string]
    :param length: the tip length to save
    """
    # TODO(lc, 07-14-2020) since we're trying not to utilize
    # a labware object for these functions, the is tiprack
    # check should happen outside of this function.
    # assert labware._is_tiprack, \
    #     'cannot save tip length for non-tiprack labware'
    labware_hash = helpers.hash_labware_def(definition)

    tip_length_data: 'TipLengthCalibration' = {
        'tipLength': length,
        'lastModified': utc_now()
    }

    data = {labware_hash + parent: tip_length_data}
    return data


def _helper_offset_data_format(filepath: str, delta: 'Point') -> dict:
    if not Path(filepath).is_file():
        calibration_data = {
            "default": {
                "offset": [delta.x, delta.y, delta.z],
                "lastModified": utc_now()
            }
        }
    else:
        calibration_data = io.read_cal_file(filepath)
        calibration_data['default']['offset'] = [delta.x, delta.y, delta.z]
        calibration_data['default']['lastModified'] =\
            utc_now()
    return calibration_data


def _append_to_index_tip_length_file(pip_id: str, lw_hash: str):
    index_file = config.get_tip_length_cal_path()/'index.json'
    try:
        index_data = io.read_cal_file(str(index_file))
    except FileNotFoundError:
        index_data = {}

    if lw_hash not in index_data:
        index_data[lw_hash] = [pip_id]
    elif pip_id not in index_data[lw_hash]:
        index_data[lw_hash].append(pip_id)

    io.save_to_file(index_file, index_data)


def save_tip_length_calibration(
        pip_id: str, tip_length_cal: 'PipTipLengthCalibration'):
    """
    Function used to save tip length calibration to file.

    :param pip_id: pipette id to associate with this tip length
    :param tip_length_cal: results of the data created using
           :meth:`create_tip_length_data`
    """
    tip_length_dir_path = config.get_tip_length_cal_path()
    tip_length_dir_path.mkdir(parents=True, exist_ok=True)
    pip_tip_length_path = tip_length_dir_path/f'{pip_id}.json'

    for lw_hash in tip_length_cal.keys():
        _append_to_index_tip_length_file(pip_id, lw_hash)

    try:
        tip_length_data = io.read_cal_file(str(pip_tip_length_path))
    except FileNotFoundError:
        tip_length_data = {}

    tip_length_data.update(tip_length_cal)

    io.save_to_file(pip_tip_length_path, tip_length_data)


def save_robot_deck_attitude(
        transform: local_types.AttitudeMatrix,
        pip_id: typing.Optional[str],
        lw_hash: typing.Optional[str]):
    robot_dir = config.get_opentrons_path('robot_calibration_dir')
    robot_dir.mkdir(parents=True, exist_ok=True)
    gantry_path = robot_dir/'deck_calibration.json'
    gantry_dict: 'DeckCalibrationData' = {
        'attitude': transform,
        'pipette_calibrated_with': pip_id,
        'last_modified': utc_now(),
        'tiprack': lw_hash
    }
    io.save_to_file(gantry_path, gantry_dict)
