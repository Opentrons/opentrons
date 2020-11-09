// @flow
import type { CalibrationLabware } from '../types'
import type { Mount } from '../../pipettes/types'

// calibration check session types

import typeof {
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_PREPARING_PIPETTE,
  CHECK_STEP_COMPARING_NOZZLE,
  CHECK_STEP_COMPARING_TIP,
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
  CHECK_STEP_RETURNING_TIP,
  CHECK_STEP_RESULTS_SUMMARY,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_CHECK_COMPLETE,
  CHECK_PIPETTE_RANK_FIRST,
  CHECK_PIPETTE_RANK_SECOND,
  CHECK_STATUS_IN_THRESHOLD,
  CHECK_STATUS_OUTSIDE_THRESHOLD,
} from './constants'

/* Robot Calibration Check Types */

export type RobotCalibrationCheckStep =
  | CHECK_STEP_SESSION_STARTED
  | CHECK_STEP_LABWARE_LOADED
  | CHECK_STEP_INSPECTING_TIP
  | CHECK_STEP_PREPARING_PIPETTE
  | CHECK_STEP_COMPARING_NOZZLE
  | CHECK_STEP_COMPARING_TIP
  | CHECK_STEP_COMPARING_HEIGHT
  | CHECK_STEP_COMPARING_POINT_ONE
  | CHECK_STEP_COMPARING_POINT_TWO
  | CHECK_STEP_COMPARING_POINT_THREE
  | CHECK_STEP_RETURNING_TIP
  | CHECK_STEP_RESULTS_SUMMARY
  | CHECK_STEP_SESSION_EXITED
  | CHECK_STEP_CHECK_COMPLETE

export type RobotCalibrationCheckPipetteRank =
  | CHECK_PIPETTE_RANK_FIRST
  | CHECK_PIPETTE_RANK_SECOND

export type RobotCalibrationCheckStatus =
  | CHECK_STATUS_IN_THRESHOLD
  | CHECK_STATUS_OUTSIDE_THRESHOLD

export type CalibrationCheckInstrument = {|
  model: string,
  name: string,
  tip_length: number,
  mount: Mount,
  rank: RobotCalibrationCheckPipetteRank,
  tipRackLoadName: string,
  tipRackDisplay: string,
  tipRackUri: string,
  serial: string,
|}

export type CalibrationCheckComparison = {|
  differenceVector: [number, number, number],
  thresholdVector: [number, number, number],
  exceedsThreshold: boolean,
|}

export type CalibrationCheckComparisonMap = {
  status: RobotCalibrationCheckStatus,
  [RobotCalibrationCheckStep]: CalibrationCheckComparison,
}

export type CalibrationCheckComparisonsPerCalibration = {
  tipLength?: CalibrationCheckComparisonMap,
  pipetteOffset?: CalibrationCheckComparisonMap,
  deck?: CalibrationCheckComparisonMap,
}

export type CalibrationCheckComparisonByPipette = {
  first: CalibrationCheckComparisonsPerCalibration,
  second: CalibrationCheckComparisonsPerCalibration,
}

export type CheckCalibrationSessionDetails = {|
  instruments: Array<CalibrationCheckInstrument>,
  currentStep: RobotCalibrationCheckStep,
  comparisonsByPipette: CalibrationCheckComparisonByPipette,
  labware: Array<CalibrationLabware>,
  activePipette: CalibrationCheckInstrument,
  activeTipRack: CalibrationLabware,
|}

export type CheckCalibrationSessionParams = {|
  hasCalibrationBlock: boolean,
  tipRacks: Array<CalibrationLabware>,
|}
