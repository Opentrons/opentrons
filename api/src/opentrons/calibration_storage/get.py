import typing

from opentrons import config
from opentrons.types import Point

from . import (
    types as local_types,
    file_operators as io, helpers,
    encoder_decoder as ed)

if typing.TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware


def _format_calibration_type(
        data: local_types.CalibrationDict) -> local_types.CalibrationTypes:
    offset = local_types.OffsetData(
        value=data['default']['offset'],
        last_modified=data['default']['lastModified']
    )
    # TODO(6/16): Tip calibration no longer exists in
    # the labware calibraiton file. We should
    # have a follow-up PR to grab tip lengths
    # based on the loaded pips + labware
    return local_types.CalibrationTypes(
            offset=offset,
            tip_length=local_types.TipLengthData()
        )


def _format_parent(
        data: local_types.CalibrationIndexDict)\
            -> local_types.ParentOptions:
    options = local_types.ParentOptions(slot=data['slot'])
    if data['module']:
        options.module = data['module']['parent']
    return options


def get_all_calibrations() -> typing.List[local_types.CalibrationInformation]:
    """
    A helper function that will list all of the given calibrations
    in a succinct way.

    :return: A list of dictionary objects representing all of the
    labware calibration files found on the robot.
    """
    all_calibrations: typing.List[local_types.CalibrationInformation] = []
    offset_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    index_path = offset_path / 'index.json'
    if not index_path.exists():
        return all_calibrations
    index_file = io._read_file(str(index_path))
    for key, data in index_file.items():
        cal_path = offset_path / f'{key}.json'
        if cal_path.exists():
            cal_blob = io._read_file(str(cal_path))
            calibration = _format_calibration_type(cal_blob)
            all_calibrations.append(
                local_types.CalibrationInformation(
                    calibration=calibration,
                    parent=_format_parent(data),
                    labware_id=key,
                    uri=data['uri']
                ))
    return all_calibrations


def get_tip_length_data(
        pip_id: str, labware_hash: str, labware_load_name: str
) -> local_types.TipLengthCalibration:
    try:
        pip_tip_length_path = config.get_tip_length_cal_path()/f'{pip_id}.json'
        tip_length_data =\
            io._read_cal_file(str(pip_tip_length_path), ed.DateTimeDecoder)
        return tip_length_data[labware_hash]
    except (FileNotFoundError, AttributeError):
        raise local_types.TipLengthCalNotFound(
            f'Tip length of {labware_load_name} has not been '
            f'calibrated for this pipette: {pip_id} and cannot'
            'be loaded')


def load_calibration(labware: 'Labware'):
    """
    Look up a calibration if it exists and apply it to the given labware.
    """
    offset_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    labware_offset_path =\
        helpers._get_labware_offset_path(labware, offset_path)
    if labware_offset_path.exists():
        calibration_data = io._read_file(str(labware_offset_path))
        offset_array = calibration_data['default']['offset']
        offset = Point(x=offset_array[0], y=offset_array[1], z=offset_array[2])
        labware.set_calibration(offset)
        if 'tipLength' in calibration_data.keys():
            tip_length = calibration_data['tipLength']['length']
            labware.tip_length = tip_length


def load_tip_length_calibration(
        pip_id: str, labware: 'Labware') -> local_types.TipLengthCalibration:
    assert labware._is_tiprack, \
        'cannot load tip length for non-tiprack labware'
    parent_id = helpers._get_parent_identifier(labware.parent)
    labware_hash = helpers._hash_labware_def(labware._definition)
    return get_tip_length_data(
        pip_id=pip_id,
        labware_hash=labware_hash + parent_id,
        labware_load_name=labware.load_name)
