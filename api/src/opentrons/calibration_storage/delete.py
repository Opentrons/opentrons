from . import types as local_types, file_operators as io

from opentrons.config import get_opentrons_path, get_tip_length_cal_path

OFFSETS_PATH = get_opentrons_path('labware_calibration_offsets_dir_v2')


def clear_calibrations():
    """
    Delete all calibration files for labware. This includes deleting tip-length
    data for tipracks.
    """
    calibration_path = OFFSETS_PATH
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
    index_path = OFFSETS_PATH / 'index.json'
    blob = io._read_file(str(index_path))

    del blob[calibration_id]
    io.save_to_file(index_path, blob)


def delete_offset_file(calibration_id: local_types.CalibrationID):
    """
    Given a labware's hash, delete the file and remove it from the index file.

    :param calibration_id: labware hash
    """
    offset = OFFSETS_PATH / f'{calibration_id}.json'
    try:
        _remove_offset_from_index(calibration_id)
        offset.unlink()
    except FileNotFoundError:
        pass


def clear_tip_length_calibration():
    """
    Delete all tip length calibration files.
    """
    tip_length_path = get_tip_length_cal_path()
    try:
        targets = (
            f for f in tip_length_path.iterdir() if f.suffix == '.json')
        for target in targets:
            target.unlink()
    except FileNotFoundError:
        pass
