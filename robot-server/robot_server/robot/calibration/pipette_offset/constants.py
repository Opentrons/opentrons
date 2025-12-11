from __future__ import annotations

from typing import TYPE_CHECKING

from opentrons_shared_data.util import StrEnum

from robot_server.robot.calibration.constants import STATE_WILDCARD

if TYPE_CHECKING:
    from typing_extensions import Final


class PipetteOffsetCalibrationState(StrEnum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


class PipetteOffsetWithTipLengthCalibrationState(StrEnum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    measuringTipOffset = "measuringTipOffset"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    tipLengthComplete = "tipLengthComplete"
    WILDCARD = STATE_WILDCARD


TIP_RACK_SLOT: Final = "8"
