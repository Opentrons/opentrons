""" opentrons.calibration_storage.modify: functions for modifying
calibration storage

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
import typing
from pathlib import Path

from dataclasses import asdict
from opentrons import config
from opentrons.types import Mount, Point

from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.util.helpers import utc_now

from . import (
    file_operators as io,
    types as local_types,
    helpers,
    migration)

if typing.TYPE_CHECKING:
    from .dev_types import (
        TipLengthCalibration, PipTipLengthCalibration,
        DeckCalibrationData, PipetteCalibrationData, CalibrationStatusDict)
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


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
        delta: Point,
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
        length: float,
        cal_status: local_types.CalibrationStatus = None
        ) -> 'PipTipLengthCalibration':
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
    labware_uri = helpers.uri_from_definition(definition)
    if cal_status:
        status = cal_status
    else:
        status = local_types.CalibrationStatus()
    status_dict: 'CalibrationStatusDict' =\
        helpers.convert_to_dict(status)  # type: ignore

    tip_length_data: 'TipLengthCalibration' = {
        'tipLength': length,
        'lastModified': utc_now(),
        'source': local_types.SourceType.user,
        'status': status_dict,
        'uri': labware_uri
    }

    if not definition.get('namespace') == OPENTRONS_NAMESPACE:
        _save_custom_tiprack_definition(labware_uri, definition)

    data = {labware_hash + parent: tip_length_data}
    return data


def _save_custom_tiprack_definition(
        labware_uri: str, definition: 'LabwareDefinition'):
    namespace, load_name, version = labware_uri.split('/')
    custom_tr_dir_path = config.get_custom_tiprack_def_path()
    custom_namespace_dir = custom_tr_dir_path/f'{namespace}/{load_name}'
    custom_namespace_dir.mkdir(parents=True, exist_ok=True)

    custom_tr_def_path = custom_namespace_dir/f'{version}.json'
    io.save_to_file(custom_tr_def_path, definition)


def _helper_offset_data_format(filepath: str, delta: Point) -> dict:
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
        lw_hash: typing.Optional[str],
        source: local_types.SourceType = None,
        cal_status: local_types.CalibrationStatus = None):
    robot_dir = config.get_opentrons_path('robot_calibration_dir')
    robot_dir.mkdir(parents=True, exist_ok=True)
    gantry_path = robot_dir/'deck_calibration.json'
    if cal_status:
        status = cal_status
    else:
        status = local_types.CalibrationStatus()
    status_dict: 'CalibrationStatusDict' =\
        helpers.convert_to_dict(status)  # type: ignore

    gantry_dict: 'DeckCalibrationData' = {
        'attitude': transform,
        'pipette_calibrated_with': pip_id,
        'last_modified': utc_now(),
        'tiprack': lw_hash,
        'source': source or local_types.SourceType.user,
        'status': status_dict
    }
    io.save_to_file(gantry_path, gantry_dict)


def _add_to_pipette_offset_index_file(pip_id: str, mount: Mount):
    index_file = config.get_opentrons_path(
        'pipette_calibration_dir') / 'index.json'
    try:
        index_data = index_data = io.read_cal_file(str(index_file))
    except FileNotFoundError:
        index_data = {}

    mount_key = mount.name.lower()
    if mount_key not in index_data:
        index_data[mount_key] = [pip_id]
    elif pip_id not in index_data[mount_key]:
        index_data[mount_key].append(pip_id)

    io.save_to_file(index_file, index_data)


def save_pipette_calibration(
        offset: Point,
        pip_id: str, mount: Mount,
        tiprack_hash: str, tiprack_uri: str,
        cal_status: local_types.CalibrationStatus = None):
    pip_dir = config.get_opentrons_path(
        'pipette_calibration_dir') / mount.name.lower()
    pip_dir.mkdir(parents=True, exist_ok=True)
    if cal_status:
        status = cal_status
    else:
        status = local_types.CalibrationStatus()
    status_dict: 'CalibrationStatusDict' =\
        helpers.convert_to_dict(status)  # type: ignore
    offset_path = pip_dir/f'{pip_id}.json'
    offset_dict: 'PipetteCalibrationData' = {
        'offset': [offset.x, offset.y, offset.z],
        'tiprack': tiprack_hash,
        'uri': tiprack_uri,
        'last_modified': utc_now(),
        'source': local_types.SourceType.user,
        'status': status_dict
    }
    io.save_to_file(offset_path, offset_dict)
    _add_to_pipette_offset_index_file(pip_id, mount)


@typing.overload
def mark_bad(
    calibration: local_types.DeckCalibration,
    source_marked_bad: local_types.SourceType
    ) -> local_types.DeckCalibration: ...


@typing.overload
def mark_bad(
    calibration: local_types.PipetteOffsetCalibration,
    source_marked_bad: local_types.SourceType
    ) -> local_types.PipetteOffsetCalibration: ...


@typing.overload
def mark_bad(
    calibration: local_types.TipLengthCalibration,
    source_marked_bad: local_types.SourceType
    ) -> local_types.TipLengthCalibration: ...


def mark_bad(calibration, source_marked_bad: local_types.SourceType):
    caldict = asdict(calibration)
    # remove current status key
    del caldict['status']
    status = local_types.CalibrationStatus(
        markedBad=True, source=source_marked_bad, markedAt=utc_now())
    return type(calibration)(**caldict, status=status)
