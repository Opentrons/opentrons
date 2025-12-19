from __future__ import annotations

from typing import TYPE_CHECKING

from opentrons_shared_data.util import StrEnum

from robot_server.robot.calibration.constants import (
    STATE_WILDCARD,
    POINT_ONE_ID,
    POINT_TWO_ID,
    POINT_THREE_ID,
)

if TYPE_CHECKING:
    from .dev_types import StatePointMap


class DeckCalibrationState(StrEnum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    savingPointTwo = "savingPointTwo"
    savingPointThree = "savingPointThree"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


TIP_RACK_SLOT = "8"

MOVE_POINT_STATE_MAP: StatePointMap = {
    DeckCalibrationState.joggingToDeck: POINT_ONE_ID,
    DeckCalibrationState.savingPointOne: POINT_TWO_ID,
    DeckCalibrationState.savingPointTwo: POINT_THREE_ID,
}
SAVE_POINT_STATE_MAP: StatePointMap = {
    DeckCalibrationState.savingPointOne: POINT_ONE_ID,
    DeckCalibrationState.savingPointTwo: POINT_TWO_ID,
    DeckCalibrationState.savingPointThree: POINT_THREE_ID,
}
