// calibration check session contants

import { sharedCalCommands } from '../common-calibration/constants'

export const CHECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const CHECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const CHECK_STEP_COMPARING_NOZZLE: 'comparingNozzle' = 'comparingNozzle'
export const CHECK_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const CHECK_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const CHECK_STEP_COMPARING_HEIGHT: 'comparingHeight' = 'comparingHeight'
export const CHECK_STEP_COMPARING_TIP: 'comparingTip' = 'comparingTip'
export const CHECK_STEP_COMPARING_POINT_ONE: 'comparingPointOne' =
  'comparingPointOne'
export const CHECK_STEP_COMPARING_POINT_TWO: 'comparingPointTwo' =
  'comparingPointTwo'
export const CHECK_STEP_COMPARING_POINT_THREE: 'comparingPointThree' =
  'comparingPointThree'
export const CHECK_STEP_CHECK_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'
export const CHECK_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'
export const CHECK_STEP_RETURNING_TIP: 'returningTip' = 'returningTip'
export const CHECK_STEP_RESULTS_SUMMARY: 'resultsSummary' = 'resultsSummary'

const CHECK_SWITCH_PIPETTE: 'calibration.check.switchPipette' =
  'calibration.check.switchPipette'
const COMPARE_POINT: 'calibration.check.comparePoint' =
  'calibration.check.comparePoint'
const RETURN_TIP: 'calibration.check.returnTip' = 'calibration.check.returnTip'
const TRANSITION: 'calibration.check.transition' =
  'calibration.check.transition'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'

export const checkCommands = {
  ...sharedCalCommands,
  CHECK_SWITCH_PIPETTE,
  COMPARE_POINT,
  TRANSITION,
  RETURN_TIP,
  EXIT,
}

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

export const DECK_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
]

export const PIPETTE_OFFSET_COMPARING_STEPS = [
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
]

export const TIP_COMPARING_STEPS = [CHECK_STEP_COMPARING_TIP]

export const CHECK_STATUS_IN_THRESHOLD: 'IN_THRESHOLD' = 'IN_THRESHOLD'
export const CHECK_STATUS_OUTSIDE_THRESHOLD: 'OUTSIDE_THRESHOLD' =
  'OUTSIDE_THRESHOLD'
