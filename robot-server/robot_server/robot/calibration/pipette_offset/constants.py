from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from robot_server.robot.calibration.constants import STATE_WILDCARD

if TYPE_CHECKING:
    from typing_extensions import Final


class GenericState(str, Enum):
    def __getattr__(self, name: str):
        # We need to define this method
        # to ensure that mypy will
        # understand the defined attributes
        # on the subclasses.
        return getattr(self.__class__, name)


class PipetteOffsetCalibrationState(GenericState):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


class PipetteOffsetWithTipLengthCalibrationState(GenericState):
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


TIP_RACK_SLOT: Final = '8'
