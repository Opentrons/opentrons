// @flow
// calibration check session types

import typeof {
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_PREPARING_FIRST_PIPETTE,
  CHECK_STEP_INSPECTING_FIRST_TIP,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
  CHECK_STEP_PREPARING_SECOND_PIPETTE,
  CHECK_STEP_INSPECTING_SECOND_TIP,
  CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_CHECK_COMPLETE,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
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
  | CHECK_STEP_PREPARING_FIRST_PIPETTE
  | CHECK_STEP_INSPECTING_FIRST_TIP
  | CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT
  | CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT
  | CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE
  | CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE
  | CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO
  | CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO
  | CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE
  | CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE
  | CHECK_STEP_PREPARING_SECOND_PIPETTE
  | CHECK_STEP_INSPECTING_SECOND_TIP
  | CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT
  | CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT
  | CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE
  | CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE
  | CHECK_STEP_SESSION_EXITED
  | CHECK_STEP_CHECK_COMPLETE
  | CHECK_STEP_BAD_ROBOT_CALIBRATION
  | CHECK_STEP_NO_PIPETTES_ATTACHED

export type RobotCalibrationCheckPipetteRank =
  | CHECK_PIPETTE_RANK_FIRST
  | CHECK_PIPETTE_RANK_SECOND

export type RobotCalibrationCheckInstrument = {|
  model: string,
  name: string,
  tip_length: number,
  mount: string,
  tiprack_id: string,
  rank: RobotCalibrationCheckPipetteRank,
  serial: string,
|}

export type RobotCalibrationCheckLabware = {|
  alternatives: Array<string>,
  slot: string,
  id: string,
  forMounts: Array<string>,
  loadName: string,
  namespace: string,
  version: number,
|}

export type CheckTransformType =
  | CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET
  | CHECK_TRANSFORM_TYPE_UNKNOWN
  | CHECK_TRANSFORM_TYPE_DECK

export type RobotCalibrationCheckComparison = {|
  differenceVector: [number, number, number],
  thresholdVector: [number, number, number],
  exceedsThreshold: boolean,
  transformType: CheckTransformType,
|}

export type RobotCalibrationCheckInstrumentsByMount = {
  [mount: string]: RobotCalibrationCheckInstrument,
  ...,
}

export type RobotCalibrationCheckComparisonsByStep = {
  [RobotCalibrationCheckStep]: RobotCalibrationCheckComparison,
  ...,
}

export type RobotCalibrationCheckSessionDetails = {|
  instruments: RobotCalibrationCheckInstrumentsByMount,
  currentStep: RobotCalibrationCheckStep,
  nextSteps: {|
    links: { [RobotCalibrationCheckStep]: string, ... },
  |},
  comparisonsByStep: RobotCalibrationCheckComparisonsByStep,
  labware: Array<RobotCalibrationCheckLabware>,
|}
