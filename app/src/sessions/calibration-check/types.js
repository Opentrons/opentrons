// @flow
import type { CalibrationLabware } from '../types'
import type { Mount } from '../../pipettes/types'

// calibration check session types

import typeof {
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_PREPARING_PIPETTE,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
  CHECK_STEP_RETURNING_TIP,
  CHECK_STEP_RESULTS_SUMMARY,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_CHECK_COMPLETE,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_PIPETTE_RANK_FIRST,
  CHECK_PIPETTE_RANK_SECOND,
} from './constants'

/* Robot Calibration Check Types */

export type RobotCalibrationCheckStep =
  | CHECK_STEP_SESSION_STARTED
  | CHECK_STEP_LABWARE_LOADED
  | CHECK_STEP_PREPARING_PIPETTE
  | CHECK_STEP_INSPECTING_TIP
  | CHECK_STEP_COMPARING_HEIGHT
  | CHECK_STEP_COMPARING_POINT_ONE
  | CHECK_STEP_COMPARING_POINT_TWO
  | CHECK_STEP_COMPARING_POINT_THREE
  | CHECK_STEP_RETURNING_TIP
  | CHECK_STEP_RESULTS_SUMMARY
  | CHECK_STEP_SESSION_EXITED
  | CHECK_STEP_CHECK_COMPLETE
  | CHECK_STEP_BAD_ROBOT_CALIBRATION

export type RobotCalibrationCheckPipetteRank =
  | CHECK_PIPETTE_RANK_FIRST
  | CHECK_PIPETTE_RANK_SECOND

export type CalibrationHealthCheckInstrument = {|
  model: string,
  name: string,
  tip_length: number,
  mount: Mount,
  rank: RobotCalibrationCheckPipetteRank,
  serial: string,
|}

export type CheckTransformType =
  | CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET
  | CHECK_TRANSFORM_TYPE_UNKNOWN
  | CHECK_TRANSFORM_TYPE_DECK

export type CalibrationHealthCheckComparison = {|
  differenceVector: [number, number, number],
  thresholdVector: [number, number, number],
  exceedsThreshold: boolean,
  transformType: CheckTransformType,
|}

export type CalibrationHealthCheckComparisonsByStep = {
  [RobotCalibrationCheckStep]: CalibrationHealthCheckComparison,
  ...,
}

export type CalibrationHealthCheckComparisonByPipette = {
  first: CalibrationHealthCheckComparisonsByStep,
  second: CalibrationHealthCheckComparisonsByStep,
}

export type CheckCalibrationHealthSessionDetails = {|
  instruments: Array<CalibrationHealthCheckInstrument>,
  currentStep: RobotCalibrationCheckStep,
  comparisonsByPipette: CalibrationHealthCheckComparisonByPipette,
  labware: Array<CalibrationLabware>,
  activePipette: CalibrationHealthCheckInstrument,
  activeTipRack: CalibrationLabware,
|}
