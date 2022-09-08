""" opentrons.calibration_storage.delete: functions that
remove single or multiple calibration files from the
file system.
"""
# TODO(mc, 2022-06-08): this module has no unit tests
# add tests before making any additional changes
from pathlib import Path

from . import file_operators as io

from opentrons import config
from opentrons.types import Mount


def _remove_tip_length_from_index(tiprack: str, pipette: str) -> None:
    """
    Remove tip length data from the index file
    """
    tip_length_dir = config.get_tip_length_cal_path()
    index_path = tip_length_dir / "index.json"
    blob = io.read_cal_file(str(index_path))

    if tiprack in blob and pipette in blob[tiprack]:
        blob[tiprack].remove(pipette)
        io.save_to_file(index_path, blob)


def delete_tip_length_calibration(tiprack: str, pipette: str) -> None:
    """
    Delete tip length calibration based on tiprack hash and
    pipette serial number

    :param tiprack: tiprack hash
    :param pipette: pipette serial number
    """
    tip_length_dir = config.get_tip_length_cal_path()
    tip_length_path = tip_length_dir / f"{pipette}.json"
    blob = io.read_cal_file(str(tip_length_path))

    if tiprack in blob:
        del blob[tiprack]
        if blob:
            io.save_to_file(tip_length_path, blob)
        else:
            tip_length_path.unlink()
        _remove_tip_length_from_index(tiprack, pipette)


def clear_tip_length_calibration() -> None:
    """
    Delete all tip length calibration files.
    """
    tip_length_path = config.get_tip_length_cal_path()
    try:
        targets = (f for f in tip_length_path.iterdir() if f.suffix == ".json")
        for target in targets:
            target.unlink()
    except FileNotFoundError:
        pass


def _remove_pipette_offset_from_index(pipette: str, mount: Mount) -> None:
    """
    Helper function to remove an individual pipette offset file.

    :param pipette: pipette serial number
    :param mount: pipette mount
    :raises FileNotFoundError: If index file does not exist or
    the specified id is not in the index file.
    """
    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    index_path = offset_dir / "index.json"
    blob = io.read_cal_file(str(index_path))

    try:
        blob[mount.name.lower()].remove(pipette)
        io.save_to_file(index_path, blob)
    except (KeyError, ValueError):
        # If the index file does not have a mount entry, you get
        # an error here
        pass


def delete_pipette_offset_file(pipette: str, mount: Mount) -> None:
    """
    Delete pipette offset file based on mount and pipette serial number

    :param pipette: pipette serial number
    :param mount: pipette mount
    """
    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    offset_path = offset_dir / mount.name.lower() / f"{pipette}.json"

    try:
        _remove_pipette_offset_from_index(pipette, mount)
        offset_path.unlink()
    except FileNotFoundError:
        pass


def _remove_json_files_in_directories(p: Path) -> None:
    """Delete json file by the path"""
    for item in p.iterdir():
        if item.is_dir():
            _remove_json_files_in_directories(item)
        elif item.suffix == ".json":
            item.unlink()


def clear_pipette_offset_calibrations() -> None:
    """
    Delete all pipette offset calibration files.
    """

    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    try:
        _remove_json_files_in_directories(offset_dir)
    except FileNotFoundError:
        pass


def delete_robot_deck_attitude() -> None:
    """
    Delete the robot deck attitude calibration.
    """
    legacy_deck_calibration_file = config.get_opentrons_path("deck_calibration_file")
    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    gantry_path = robot_dir / "deck_calibration.json"

    # TODO(mc, 2022-06-08): this leaves legacy deck calibration backup files in place
    # we should eventually clean them up, too, because they can really crowd /data/
    _delete_file(legacy_deck_calibration_file)
    _delete_file(gantry_path)


def delete_gripper_calibration_file(gripper: str) -> None:
    """
    Delete gripper calibration offset file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_dir = config.get_opentrons_path("gripper_calibration_dir")
    offset_path = offset_dir / f"{gripper}.json"

    if offset_path.exists():
        offset_path.unlink()


def clear_gripper_calibration_offsets() -> None:
    """
    Delete all gripper calibration data files.
    """

    offset_dir = config.get_opentrons_path("gripper_calibration_dir")
    try:
        _remove_json_files_in_directories(offset_dir)
    except FileNotFoundError:
        pass


# TODO(mc, 2022-06-07): replace with Path.unlink(missing_ok=True)
# when we are on Python >= 3.8
def _delete_file(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass
