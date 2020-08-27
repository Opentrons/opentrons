from __future__ import annotations


from typing import TYPE_CHECKING
from enum import Enum
from typing import TYPE_CHECKING
from robot_server.robot.calibration.constants import STATE_WILDCARD

if TYPE_CHECKING:
    from typing_extensions import Final


class PipetteOffsetCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


JOG_TO_DECK_SLOT: 'Final' = '5'
TIP_RACK_SLOT: 'Final' = '8'
