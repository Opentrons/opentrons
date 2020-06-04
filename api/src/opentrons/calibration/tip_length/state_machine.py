import typing
from enum import Enum

from opentrons.calibration.util import StateMachine, WILDCARD


"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""


class TipCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    measuringTipOffset = "measuringTipOffset"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"


class TipCalibrationTrigger(str, Enum):
    load_labware = "loadLabware"
    move_to_measure_nozzle_offset = "moveToMeasureNozzleOffset"
    save_nozzle_position = "saveNozzlePosition"
    jog = "jog"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    save_tip_position = "saveTipPosition"
    exit_session = "exitSession"


TIP_LENGTH_TRANSITIONS: typing.List[typing.Dict[str, typing.Any]] = [
    {
        "trigger": TipCalibrationTrigger.load_labware,
        "from_state": TipCalibrationState.sessionStarted,
        "to_state": TipCalibrationState.labwareLoaded,
        # TODO: load tiprack and (has_calibration_block && cal block)
    },
    {
        "trigger": TipCalibrationTrigger.move_to_measure_nozzle_offset,
        "from_state": TipCalibrationState.labwareLoaded,
        "to_state": TipCalibrationState.measuringNozzleOffset,
        # TODO: move nozzle to has_calibration_block ? block : trash edge
    },
    {
        "trigger": TipCalibrationTrigger.jog,
        "from_state": TipCalibrationState.measuringNozzleOffset,
        "to_state": TipCalibrationState.measuringNozzleOffset,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipCalibrationTrigger.save_nozzle_position,
        "from_state": TipCalibrationState.measuringNozzleOffset,
        "to_state": TipCalibrationState.preparingPipette,
        # TODO: save jogged-to position
        # TODO: after saving position move nozzle to tiprack A1
    },
    {
        "trigger": TipCalibrationTrigger.jog,
        "from_state": TipCalibrationState.preparingPipette,
        "to_state": TipCalibrationState.preparingPipette,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipCalibrationTrigger.pick_up_tip,
        "from_state": TipCalibrationState.preparingPipette,
        "to_state": TipCalibrationState.inspectingTip,
        # TODO: pick up tip
    },
    {
        "trigger": TipCalibrationTrigger.invalidate_tip,
        "from_state": TipCalibrationState.inspectingTip,
        "to_state": TipCalibrationState.preparingPipette,
        # TODO: return (tip)
        # TODO: move nozzle back to safety buffer above tip to pick up
    },
    {
        "trigger": TipCalibrationTrigger.confirm_tip_attached,
        "from_state": TipCalibrationState.inspectingTip,
        "to_state": TipCalibrationState.measuringTipOffset,
        # TODO: move pip with tip has_calibration_block ? block : trash edge
    },
    {
        "trigger": TipCalibrationTrigger.jog,
        "from_state": TipCalibrationState.measuringTipOffset,
        "to_state": TipCalibrationState.measuringTipOffset,
        # TODO: jog pipette by supplied offset vector
    },
    {
        "trigger": TipCalibrationTrigger.save_tip_position,
        "from_state": TipCalibrationState.measuringTipOffset,
        "to_state": TipCalibrationState.calibrationComplete,
    },
    {
        "trigger": TipCalibrationTrigger.exit_session,
        "from_state": WILDCARD,
        "to_state": TipCalibrationState.sessionExited,
        # TODO: if tip on pipette return tip to it's well in tiprack
    },
]


class TipCalibrationStateMachine(StateMachine):
    def __init__(self,
                 has_calibration_block=True,
                 initial_state=TipCalibrationState.sessionStarted):
        StateMachine.__init__(self,
                              states=[s for s in TipCalibrationState],
                              transitions=TIP_LENGTH_TRANSITIONS,
                              initial_state=initial_state)
        self._has_calibration_block = has_calibration_block
