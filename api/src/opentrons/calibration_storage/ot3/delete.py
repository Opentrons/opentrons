""" opentrons.calibration_storage.delete: functions that
remove single or multiple calibration files from the
file system.
"""
# TODO(mc, 2022-06-08): this module has no unit tests
# add tests before making any additional changes
from pathlib import Path
import os

from .. import file_operators as io

from opentrons import config
from opentrons.types import Mount

from . import cache as calibration_cache


# TODO(mc, 2022-06-07): replace with Path.unlink(missing_ok=True)
# when we are on Python >= 3.8
def _delete_file(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass


def _remove_json_files_in_directories(p: Path) -> None:
    """Delete json file by the path"""
    for item in p.iterdir():
        if item.is_dir():
            _remove_json_files_in_directories(item)
        elif item.suffix == ".json":
            _delete_file(item)


def delete_tip_length_calibration(tiprack: str, pipette_id: str) -> None:
    """
    Delete tip length calibration based on tiprack hash and
    pipette serial number

    :param tiprack: tiprack hash
    :param pipette: pipette serial number
    """
    tip_lengths_for_pipette = calibration_cache.tip_lengths_for_pipette(pipette_id)
    if tiprack in tip_lengths_for_pipette:
        # maybe make modify and delete same file?
        del tip_lengths_for_pipette[tiprack]
        tip_length_path = config.get_tip_length_cal_path() / f"{pipette_id}.json"
        if tip_lengths_for_pipette:
            io.save_to_file(tip_length_path, tip_lengths_for_pipette)
        else:
            tip_length_path.unlink()
        calibration_cache._tip_length_calibrations.cache_clear()


def clear_tip_length_calibration() -> None:
    """
    Delete all tip length calibration files.
    """
    offset_dir = config.get_tip_length_cal_path()
    try:
        _remove_json_files_in_directories(offset_dir)
    except FileNotFoundError:
        pass
    calibration_cache._tip_length_calibrations.cache_clear()


def delete_pipette_offset_file(pipette: str, mount: Mount) -> None:
    """
    Delete pipette offset file based on mount and pipette serial number

    :param pipette: pipette serial number
    :param mount: pipette mount
    """
    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    offset_path = offset_dir / mount.name.lower() / f"{pipette}.json"
    _delete_file(offset_path)
    calibration_cache._pipette_offset_calibrations.cache_clear()


def clear_pipette_offset_calibrations() -> None:
    """
    Delete all pipette offset calibration files.
    """

    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    _remove_json_files_in_directories(offset_dir)
    calibration_cache._pipette_offset_calibrations.cache_clear()


def delete_robot_deck_attitude() -> None:
    """
    Delete the robot deck attitude calibration.
    """
    #TODO(lc 09-19-2022) finalize with hardware about whether this can truly be deleted.
    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    gantry_path = robot_dir / "deck_calibration.json"

    _delete_file(gantry_path)
    calibration_cache._deck_calibration.cache_clear()


def delete_gripper_calibration_file(gripper: str) -> None:
    """
    Delete gripper calibration offset file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_path = (
        config.get_opentrons_path("gripper_calibration_dir") / f"{gripper}.json"
    )
    _delete_file(offset_path)
    calibration_cache._gripper_offset_calibrations.cache_clear()


def clear_gripper_calibration_offsets() -> None:
    """
    Delete all gripper calibration data files.
    """

    offset_dir = config.get_opentrons_path("gripper_calibration_dir")
    _remove_json_files_in_directories(offset_dir)
    calibration_cache._gripper_offset_calibrations.cache_clear()
