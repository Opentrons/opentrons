import logging
import numpy as np  # type: ignore
from dataclasses import dataclass
from typing import Optional, List

from opentrons import config

from opentrons.config.robot_configs import get_legacy_gantry_calibration
from opentrons.calibration_storage import modify, types, get
from opentrons.types import Mount
from opentrons.util import linal

from .util import DeckTransformState

log = logging.getLogger(__name__)


@dataclass
class RobotCalibration:
    deck_calibration: types.DeckCalibration


def build_temporary_identity_calibration() -> RobotCalibration:
    """
    Get a temporary identity deck cal suitable for use during
    calibration
    """
    return RobotCalibration(
        deck_calibration=types.DeckCalibration(
            attitude=linal.identity_deck_transform().tolist(),
            source=types.SourceType.default,
            status=types.CalibrationStatus()))


def validate_attitude_deck_calibration(deck_cal: types.DeckCalibration):
    """
    This function determines whether the deck calibration is valid
    or not based on the following use-cases:

    TODO(lc, 8/10/2020): Expand on this method, or create
    another method to diagnose bad instrument offset data
    """
    curr_cal = np.array(deck_cal.attitude)
    row, _ = curr_cal.shape
    rank = np.linalg.matrix_rank(curr_cal)
    if row != rank:
        # Check that the matrix is non-singular
        return DeckTransformState.SINGULARITY
    elif not deck_cal.last_modified:
        # Check that the matrix is not an identity
        return DeckTransformState.IDENTITY
    else:
        # Transform as it stands is sufficient.
        return DeckTransformState.OK


def validate_gantry_calibration(gantry_cal: List[List[float]]):
    """
    This function determines whether the gantry calibration is valid
    or not based on the following use-cases:
    """
    curr_cal = np.array(gantry_cal)
    row, _ = curr_cal.shape

    rank = np.linalg.matrix_rank(curr_cal)

    id_matrix = linal.identity_deck_transform()

    z = abs(curr_cal[2][-1])

    outofrange = z < 16 or z > 34
    if row != rank:
        # Check that the matrix is non-singular
        return DeckTransformState.SINGULARITY
    elif np.array_equal(curr_cal, id_matrix):
        # Check that the matrix is not an identity
        return DeckTransformState.IDENTITY
    elif outofrange:
        # Check that the matrix is not out of range.
        return DeckTransformState.BAD_CALIBRATION
    else:
        # Transform as it stands is sufficient.
        return DeckTransformState.OK


def migrate_affine_xy_to_attitude(
        gantry_cal: List[List[float]]) -> types.AttitudeMatrix:
    masked_transform = np.array([
        [True, True, True, False],
        [True, True, True, False],
        [False, False, False, False],
        [False, False, False, False]])
    masked_array = np.ma.masked_array(gantry_cal, ~masked_transform)
    attitude_array = np.zeros((3, 3))
    np.put(attitude_array, [0, 1, 2], masked_array[0].compressed())
    np.put(attitude_array, [3, 4, 5], masked_array[1].compressed())
    np.put(attitude_array, 8, 1)
    return attitude_array.tolist()


def save_attitude_matrix(
        expected: linal.SolvePoints, actual: linal.SolvePoints,
        pipette_id: str, tiprack_hash: str):
    attitude = linal.solve_attitude(expected, actual)
    modify.save_robot_deck_attitude(attitude, pipette_id, tiprack_hash)


def load_attitude_matrix() -> types.DeckCalibration:
    calibration_data = get.get_robot_deck_attitude()
    gantry_cal = get_legacy_gantry_calibration()
    if not calibration_data and gantry_cal:
        if validate_gantry_calibration(gantry_cal) == DeckTransformState.OK:
            log.debug(
                "Attitude deck calibration matrix not found. Migrating "
                "existing affine deck calibration matrix to {}".format(
                    config.get_opentrons_path('robot_calibration_dir')))
            attitude = migrate_affine_xy_to_attitude(gantry_cal)
            modify.save_robot_deck_attitude(transform=attitude,
                                            pip_id=None,
                                            lw_hash=None,
                                            source=types.SourceType.legacy)
            calibration_data = get.get_robot_deck_attitude()

    if calibration_data:
        return calibration_data
    else:
        # load default if deck calibration data do not exist
        return types.DeckCalibration(
            attitude=config.robot_configs.DEFAULT_DECK_CALIBRATION_V2,
            source=types.SourceType.default,
            status=types.CalibrationStatus())


def load_pipette_offset(
        pip_id: Optional[str],
        mount: Mount) -> types.PipetteOffsetByPipetteMount:
    # load default if pipette offset data do not exist
    pip_cal_obj = types.PipetteOffsetByPipetteMount(
        offset=config.robot_configs.DEFAULT_PIPETTE_OFFSET,
        source=types.SourceType.default,
        status=types.CalibrationStatus())
    if pip_id:
        pip_offset_data = get.get_pipette_offset(pip_id, mount)
        if pip_offset_data:
            return pip_offset_data
    return pip_cal_obj


def load() -> RobotCalibration:
    return RobotCalibration(
        deck_calibration=load_attitude_matrix())
