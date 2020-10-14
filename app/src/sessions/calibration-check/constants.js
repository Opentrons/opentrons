// @flow
// calibration check session contants

import { sharedCalCommands } from '../common-calibration/constants'

export const CHECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const CHECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const CHECK_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const CHECK_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const CHECK_STEP_COMPARING_HEIGHT: 'comparingHeight' = 'comparingHeight'
export const CHECK_STEP_COMPARING_POINT_ONE: 'comparingPointOne' =
  'comparingPointOne'
export const CHECK_STEP_COMPARING_POINT_TWO: 'comparingPointTwo' =
  'comparingPointTwo'
export const CHECK_STEP_COMPARING_POINT_THREE: 'comparingPointThree' =
  'comparingPointThree'
export const CHECK_STEP_CHECK_COMPLETE: 'checkComplete' = 'checkComplete'
export const CHECK_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'
export const CHECK_STEP_BAD_ROBOT_CALIBRATION: 'badCalibrationData' =
  'badCalibrationData'
export const CHECK_STEP_NO_PIPETTES_ATTACHED: 'noPipettesAttached' =
  'noPipettesAttached'

const CHECK_SECOND_PIPETTE: 'calibration.check.checkForSecondPipette' =
  'calibration.check.checkForSecondPipette'
const COMPARE_POINT: 'calibration.check.comparePoint' =
  'calibration.check.comparePoint'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'

export const checkCommands = {
  ...sharedCalCommands,
  CHECK_SECOND_PIPETTE,
  COMPARE_POINT,
  EXIT,
}

export const CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET = 'BAD_INSTRUMENT_OFFSET'
export const CHECK_TRANSFORM_TYPE_UNKNOWN = 'UNKNOWN'
export const CHECK_TRANSFORM_TYPE_DECK = 'BAD_DECK_TRANSFORM'

export const CHECK_PIPETTE_RANK_FIRST: 'first' = 'first'
export const CHECK_PIPETTE_RANK_SECOND: 'second' = 'second'

export const FIRST_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
]

export const SECOND_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
]
