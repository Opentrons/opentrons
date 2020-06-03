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
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    measuringTipOffset = "measuringTipOffset"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"


class TipLengthCalibrationTrigger(str, Enum):
    load_labware = "loadLabware"
    move_to_measure_nozzle_offset = "moveToMeasureNozzleOffset"
    save_nozzle_position = "saveNozzlePositon"
    jog = "jog"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    save_tip_position = "saveTipPosition"
    exit_session = "exitSession"


TIP_LENGTH_TRANSITIONS: typing.List[typing.Dict[str, typing.Any]] = [
    {
        "trigger": TipLengthCalibrationTrigger.load_labware,
        "from_state": TipLengthCalibrationState.sessionStarted,
        "to_state": TipLengthCalibrationState.labwareLoaded,
        # TODO: load tiprack and (has_calibration_block && cal block)
    },
    {
        "trigger": TipLengthCalibrationTrigger.move_to_measure_nozzle_offset,
        "from_state": TipLengthCalibrationState.labwareLoaded,
        "to_state": TipLengthCalibrationState.measuringNozzleOffset,
        # TODO: move nozzle to has_calibration_block ? block : trash edge
    },
    {
        "trigger": TipLengthCalibrationTrigger.jog,
        "from_state": TipLengthCalibrationState.measuringNozzleOffset,
        "to_state": TipLengthCalibrationState.measuringNozzleOffset,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipLengthCalibrationTrigger.save_nozzle_position,
        "from_state": TipLengthCalibrationState.measuringNozzleOffset,
        "to_state": TipLengthCalibrationState.preparingPipette,
        # TODO: save jogged-to position
        # TODO: after saving position move nozzle to tiprack A1
    },
    {
        "trigger": TipLengthCalibrationTrigger.jog,
        "from_state": TipLengthCalibrationState.preparingPipette,
        "to_state": TipLengthCalibrationState.preparingPipette,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipLengthCalibrationTrigger.pick_up_tip,
        "from_state": TipLengthCalibrationState.preparingPipette,
        "to_state": TipLengthCalibrationState.inspectingTip,
        # TODO: pick up tip
    },
    {
        "trigger": TipLengthCalibrationTrigger.invalidate_tip,
        "from_state": TipLengthCalibrationState.inspectingTip,
        "to_state": TipLengthCalibrationState.preparingPipette,
        # TODO: return (tip)
        # TODO: move nozzle back to safety buffer above tip to pick up
    },
    {
        "trigger": TipLengthCalibrationTrigger.confirm_tip_attached,
        "from_state": TipLengthCalibrationState.inspectingTip,
        "to_state": TipLengthCalibrationState.measuringTipOffset,
        # TODO: move pip with tip has_calibration_block ? block : trash edge
    },
    {
        "trigger": TipLengthCalibrationTrigger.jog,
        "from_state": TipLengthCalibrationState.measuringTipOffset,
        "to_state": TipLengthCalibrationState.measuringTipOffset,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipLengthCalibrationTrigger.save_tip_position,
        "from_state": TipLengthCalibrationState.measuringTipOffset,
        "to_state": TipLengthCalibrationState.calibrationComplete,
    },
    {
        "trigger": TipLengthCalibrationTrigger.exit_session,
        "from_state": TipLengthCalibrationState.calibrationComplete,
        "to_state": TipLengthCalibrationState.sessionExited,
        # TODO: return tip to it's well in tiprack
    },
]


class TipLengthCalibrationStateMachine(StateMachine):
    def __init__(self, has_calibration_block=True):
        StateMachine.__init__(self, states=[s for s in TipLengthCalibrationState],
                              transitions=TIP_LENGTH_TRANSITIONS,
                              initial_state="sessionStarted")
        self._has_calibration_block = has_calibration_block

