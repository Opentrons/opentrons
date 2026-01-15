from datetime import datetime

import pytest

from opentrons.calibration_storage.types import (
    CalibrationStatus,
    SourceType,
)
from opentrons.hardware_control import API, ThreadManager
from opentrons.hardware_control.robot_calibration import (
    DeckCalibration,
    RobotCalibration,
)
from opentrons.hardware_control.util import DeckTransformState


@pytest.mark.ot2_only  # ot3 attitude is always correct
async def test_validating_attitude(hardware: ThreadManager[API]) -> None:
    inrange_matrix = [[1.0, 0, 1], [0.0, 1, 2], [0.0, 0, 1]]
    deck_cal = DeckCalibration(
        attitude=inrange_matrix,
        last_modified=datetime.now(),
        source=SourceType.user,
        status=CalibrationStatus(),
    )

    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))

    assert hardware.validate_calibration() == DeckTransformState.OK

    identity_matrix = [[1.0, 0, 0], [0.0, 1, 0], [0.0, 0, 1]]
    deck_cal.attitude = identity_matrix
    deck_cal.last_modified = None
    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))
    assert hardware.validate_calibration() == DeckTransformState.IDENTITY

    singular_matrix = [[0.0, 0, 0], [0.0, 0, 0], [0.0, 0, 1]]
    deck_cal.attitude = singular_matrix
    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))

    assert hardware.validate_calibration() == DeckTransformState.SINGULARITY
