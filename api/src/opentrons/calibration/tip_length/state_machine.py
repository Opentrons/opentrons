import typing

from opentrons.calibration.util import StateMachine


"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""


class TipLengthCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    sessionExited = "sessionExited"
    calibrationComplete = "calibrationComplete"


class TipLengthCalibrationTrigger(str, Enum):
    load_labware = "loadLabware"
    prepare_pipette = "preparePipette"
    jog = "jog"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    exit = "exitSession"


TIP_LENGTH_TRANSITIONS: typing.List[typing.Dict[str, typing.Any]] = [
    {
        "trigger": TipLengthCalibrationTrigger.load_labware,
        "from_state": TipLengthCalibrationState.sessionStarted,
        "to_state": TipLengthCalibrationState.labwareLoaded,
    },
]


class TipLengthCalibrationStateMachine(StateMachine):
    def __init__(self):
        StateMachine.__init__(self, states=[s for s in TipLengthCalibrationState],
                              transitions=TIP_LENGTH_TRANSITIONS,
                              initial_state="sessionStarted")
