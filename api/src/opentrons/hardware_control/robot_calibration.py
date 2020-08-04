import numpy as np  # type: ignore
from dataclasses import dataclass
from datetime import datetime
from typing import Tuple, List, Optional

from opentrons.config import feature_flags as ff
from opentrons.calibration_storage import modify, types, get
from opentrons.util import linal

SolvedPoints = List[Tuple[float, float]]


@dataclass
class DeckCalibration:
    attitude: Optional[types.AttitudeMatrix] = None
    last_modified: Optional[datetime] = None
    pipette_calibrated_with: Optional[str] = None
    tiprack: Optional[str] = None


@dataclass
class RobotCalibration:
    deck_calibration: DeckCalibration


def save_attitude_matrix(
        expected: SolvedPoints, actual: SolvedPoints,
        pipette_id: str, tiprack_hash: str):
    attitude = linal.solve(expected, actual).round(4).tolist()
    modify.save_robot_deck_attitude(attitude, pipette_id, tiprack_hash)


def load_attitude_matrix() -> DeckCalibration:
    deck_cal_obj = DeckCalibration(**get.get_robot_deck_attitude())
    # Add in an extra row + column to the attitude matrix to utilize
    # current functions for transformation calculations.
    deck_cal_obj.attitude = linal.add_z(np.array(deck_cal_obj.attitude), 0)
    return deck_cal_obj


def load() -> RobotCalibration:
    if ff.enable_calibration_overhaul():
        return RobotCalibration(deck_calibration=load_attitude_matrix())
    else:
        return RobotCalibration(deck_calibration=DeckCalibration())
