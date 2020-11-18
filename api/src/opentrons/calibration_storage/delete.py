""" opentrons.calibration_storage.delete: functions that
remove single or multiple calibration files from the
file system.
"""
from pathlib import Path

from . import types as local_types, file_operators as io

from opentrons import config
from opentrons.types import Mount


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


def _remove_tip_length_from_index(tiprack: str, pipette: str):
    """
    Remove tip length data from the index file
    """
    tip_length_dir = config.get_tip_length_cal_path()
    index_path = tip_length_dir / 'index.json'
    blob = io.read_cal_file(str(index_path))

    if tiprack in blob and pipette in blob[tiprack]:
        blob[tiprack].remove(pipette)
        io.save_to_file(index_path, blob)


def delete_tip_length_calibration(tiprack: str, pipette: str):
    """
    Delete tip length calibration based on tiprack hash and
    pipette serial number

    :param tiprack: tiprack hash
    :param pipette: pipette serial number
    """
    tip_length_dir = config.get_tip_length_cal_path()
    tip_length_path = tip_length_dir / f'{pipette}.json'
    blob = io.read_cal_file(str(tip_length_path))

    if tiprack in blob:
        del blob[tiprack]
        if blob:
            io.save_to_file(tip_length_path, blob)
        else:
            tip_length_path.unlink()
        _remove_tip_length_from_index(tiprack, pipette)


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


def _remove_pipette_offset_from_index(pipette: str, mount: Mount):
    """
    Helper function to remove an individual pipette offset file.

    :param pipette: pipette serial number
    :param mount: pipette mount
    :raises FileNotFoundError: If index file does not exist or
    the specified id is not in the index file.
    """
    offset_dir = config.get_opentrons_path('pipette_calibration_dir')
    index_path = offset_dir / 'index.json'
    blob = io.read_cal_file(str(index_path))

    try:
        blob[mount.name.lower()].remove(pipette)
        io.save_to_file(index_path, blob)
    except (KeyError, ValueError):
        # If the index file does not have a mount entry, you get
        # an error here
        pass


def delete_pipette_offset_file(pipette: str, mount: Mount):
    """
    Delete pipette offset file based on mount and pipette serial number

    :param pipette: pipette serial number
    :param mount: pipette mount
    """
    offset_dir = config.get_opentrons_path('pipette_calibration_dir')
    offset_path = offset_dir / mount.name.lower() / f'{pipette}.json'

    try:
        _remove_pipette_offset_from_index(pipette, mount)
        offset_path.unlink()
    except FileNotFoundError:
        pass


def clear_pipette_offset_calibrations():
    """
    Delete all pipette offset calibration files.
    """

    def _remove_json_files_in_directories(p: Path):
        for item in p.iterdir():
            if item.is_dir():
                _remove_json_files_in_directories(item)
            elif item.suffix == '.json':
                item.unlink()

    offset_dir = config.get_opentrons_path('pipette_calibration_dir')
    try:
        _remove_json_files_in_directories(offset_dir)
    except FileNotFoundError:
        pass


def delete_robot_deck_attitude():
    """
    Delete the robot deck attitude calibration.
    """

    robot_dir = config.get_opentrons_path('robot_calibration_dir')
    gantry_path = robot_dir / 'deck_calibration.json'
    if gantry_path.exists():
        gantry_path.unlink()
