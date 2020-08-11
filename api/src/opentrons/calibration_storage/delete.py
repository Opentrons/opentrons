""" opentrons.calibration_storage.delete: functions that
remove single or multiple calibration files from the
file system.
"""
from . import types as local_types, file_operators as io

from opentrons import config


def clear_calibrations():
    """
    Delete all calibration files for labware. This includes deleting tip-length
    data for tipracks.
    """
    calibration_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    try:
        targets = [
            f for f in calibration_path.iterdir() if f.suffix == '.json']
        for target in targets:
            target.unlink()
    except FileNotFoundError:
        pass


def _remove_offset_from_index(calibration_id: local_types.CalibrationID):
    """
    Helper function to remove an individual offset file.

    :param calibration_id: labware hash
    :raises FileNotFoundError: If index file does not exist or
    the specified id is not in the index file.
    """
    offset_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    index_path = offset_path / 'index.json'
    blob = io.read_cal_file(str(index_path))

    del blob['data'][calibration_id]
    io.save_to_file(index_path, blob)


def delete_offset_file(calibration_id: local_types.CalibrationID):
    """
    Given a labware's hash, delete the file and remove it from the index file.

    :param calibration_id: labware hash
    """
    offset_path =\
        config.get_opentrons_path('labware_calibration_offsets_dir_v2')
    offset = offset_path / f'{calibration_id}.json'
    try:
        _remove_offset_from_index(calibration_id)
        offset.unlink()
    except FileNotFoundError:
        pass


def clear_tip_length_calibration():
    """
    Delete all tip length calibration files.
    """
    tip_length_path = config.get_tip_length_cal_path()
    try:
        targets = (
            f for f in tip_length_path.iterdir() if f.suffix == '.json')
        for target in targets:
            target.unlink()
    except FileNotFoundError:
        pass
