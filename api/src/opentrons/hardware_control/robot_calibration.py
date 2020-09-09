import logging
import numpy as np  # type: ignore
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

from opentrons import config
from opentrons.config import robot_configs, feature_flags as ff
from opentrons.calibration_storage import modify, types, get
from opentrons.types import Mount
from opentrons.util import linal

from .util import DeckTransformState

log = logging.getLogger(__name__)


@dataclass
class DeckCalibration:
    attitude: types.AttitudeMatrix
    last_modified: Optional[datetime] = None
    pipette_calibrated_with: Optional[str] = None
    tiprack: Optional[str] = None


@dataclass
class PipetteCalibration:
    offset: types.PipetteOffset
    tiprack: Optional[str] = None
    uri: Optional[str] = None
    last_modified: Optional[datetime] = None


@dataclass
class RobotCalibration:
    deck_calibration: DeckCalibration


def validate_attitude_deck_calibration(deck_cal: DeckCalibration):
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


def load_attitude_matrix() -> DeckCalibration:
    calibration_data = get.get_robot_deck_attitude()
    if not calibration_data and ff.enable_calibration_overhaul():
        gantry_cal = robot_configs.load().gantry_calibration
        if validate_gantry_calibration(gantry_cal) == DeckTransformState.OK:
            log.debug(
                "Attitude deck calibration matrix not found. Migrating "
                "existing affine deck calibration matrix to {}".format(
                    config.get_opentrons_path('robot_calibration_dir')))
            attitude = migrate_affine_xy_to_attitude(gantry_cal)
            modify.save_robot_deck_attitude(transform=attitude,
                                            pip_id=None,
                                            lw_hash=None)
            calibration_data = get.get_robot_deck_attitude()

    if calibration_data:
        deck_cal_obj = DeckCalibration(**calibration_data)
    else:
        deck_cal_obj = DeckCalibration(
            attitude=robot_configs.DEFAULT_DECK_CALIBRATION_V2)
    return deck_cal_obj


def load_pipette_offset(
        pip_id: Optional[str],
        mount: Mount) -> PipetteCalibration:
    pip_cal_obj = PipetteCalibration(
        offset=robot_configs.DEFAULT_PIPETTE_OFFSET)
    if pip_id:
        pip_offset_data = get.get_pipette_offset(pip_id, mount)
        if pip_offset_data:
            pip_cal_obj = PipetteCalibration(**pip_offset_data)
    return pip_cal_obj


def load() -> RobotCalibration:
    return RobotCalibration(
        deck_calibration=load_attitude_matrix())
