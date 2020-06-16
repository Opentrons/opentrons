// @flow

/* Robot Calibration Check Constants */

export const CHECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const CHECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const CHECK_STEP_PREPARING_FIRST_PIPETTE: 'preparingFirstPipette' =
  'preparingFirstPipette'
export const CHECK_STEP_INSPECTING_FIRST_TIP: 'inspectingFirstTip' =
  'inspectingFirstTip'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT: 'joggingFirstPipetteToHeight' =
  'joggingFirstPipetteToHeight'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT: 'comparingFirstPipetteHeight' =
  'comparingFirstPipetteHeight'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE: 'joggingFirstPipetteToPointOne' =
  'joggingFirstPipetteToPointOne'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE: 'comparingFirstPipettePointOne' =
  'comparingFirstPipettePointOne'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO: 'joggingFirstPipetteToPointTwo' =
  'joggingFirstPipetteToPointTwo'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO: 'comparingFirstPipettePointTwo' =
  'comparingFirstPipettePointTwo'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE: 'joggingFirstPipetteToPointThree' =
  'joggingFirstPipetteToPointThree'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: 'comparingFirstPipettePointThree' =
  'comparingFirstPipettePointThree'
export const CHECK_STEP_PREPARING_SECOND_PIPETTE: 'preparingSecondPipette' =
  'preparingSecondPipette'
export const CHECK_STEP_INSPECTING_SECOND_TIP: 'inspectingSecondTip' =
  'inspectingSecondTip'
export const CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT: 'joggingSecondPipetteToHeight' =
  'joggingSecondPipetteToHeight'
export const CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: 'comparingSecondPipetteHeight' =
  'comparingSecondPipetteHeight'
export const CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE: 'joggingSecondPipetteToPointOne' =
  'joggingSecondPipetteToPointOne'
export const CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: 'comparingSecondPipettePointOne' =
  'comparingSecondPipettePointOne'
export const CHECK_STEP_CHECK_COMPLETE: 'checkComplete' = 'checkComplete'
export const CHECK_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'
export const CHECK_STEP_BAD_ROBOT_CALIBRATION: 'badCalibrationData' =
  'badCalibrationData'
export const CHECK_STEP_NO_PIPETTES_ATTACHED: 'noPipettesAttached' =
  'noPipettesAttached'

const LOAD_LABWARE: 'loadLabware' = 'loadLabware'
const PREPARE_PIPETTE: 'preparePipette' = 'preparePipette'
const JOG: 'jog' = 'jog'
const PICK_UP_TIP: 'pickUpTip' = 'pickUpTip'
const CONFIRM_TIP: 'confirmTip' = 'confirmTip'
const INVALIDATE_TIP: 'invalidateTip' = 'invalidateTip'
const COMPARE_POINT: 'comparePoint' = 'comparePoint'
const GO_TO_NEXT_CHECK: 'goToNextCheck' = 'goToNextCheck'
const EXIT: 'exitSession' = 'exitSession'

export const checkCommands = {
  LOAD_LABWARE,
  PREPARE_PIPETTE,
  JOG,
  PICK_UP_TIP,
  CONFIRM_TIP,
  INVALIDATE_TIP,
  COMPARE_POINT,
  GO_TO_NEXT_CHECK,
  EXIT,
}

export const CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET = 'BAD_INSTRUMENT_OFFSET'
export const CHECK_TRANSFORM_TYPE_UNKNOWN = 'UNKNOWN'
export const CHECK_TRANSFORM_TYPE_DECK = 'BAD_DECK_TRANSFORM'

export const CHECK_PIPETTE_RANK_FIRST: 'first' = 'first'
export const CHECK_PIPETTE_RANK_SECOND: 'second' = 'second'

export const FIRST_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
]

export const SECOND_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
]

/* Tip Length Calibration Constants */

export const TIP_LENGTH_STEP_SESSION_STARTED: 'sessionStarted' =
  'sessionStarted'
export const TIP_LENGTH_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET: 'measuringNozzleOffset' =
  'measuringNozzleOffset'
export const TIP_LENGTH_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const TIP_LENGTH_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const TIP_LENGTH_STEP_MEASURING_TIP_OFFSET: 'measuringTipOffset' =
  'measuringTipOffset'
export const TIP_LENGTH_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'
