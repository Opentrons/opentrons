from dataclasses import dataclass
from datetime import datetime
from typing import Tuple, List, Optional

from opentrons.config import robot_configs
from opentrons.calibration_storage import modify, types, get
from opentrons.util import linal

SolvedPoints = List[Tuple[float, float, float]]


@dataclass
class DeckCalibration:
    attitude: types.AttitudeMatrix
    last_modified: Optional[datetime] = None
    pipette_calibrated_with: Optional[str] = None
    tiprack: Optional[str] = None


@dataclass
class RobotCalibration:
    deck_calibration: DeckCalibration


def save_attitude_matrix(
        expected: SolvedPoints, actual: SolvedPoints,
        pipette_id: str, tiprack_hash: str):
    attitude = linal.solve_attitude(expected, actual)
    modify.save_robot_deck_attitude(attitude, pipette_id, tiprack_hash)


def load_attitude_matrix() -> DeckCalibration:
    calibration_data = get.get_robot_deck_attitude()
    if calibration_data:
        deck_cal_obj = DeckCalibration(**calibration_data)
    else:
        deck_cal_obj = DeckCalibration(
            attitude=robot_configs.DEFAULT_DECK_CALIBRATION_V2)
    return deck_cal_obj


def load() -> RobotCalibration:
    return RobotCalibration(deck_calibration=load_attitude_matrix())
