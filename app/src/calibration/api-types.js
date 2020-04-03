// @flow

import {
  CHECK_STEP_SESSION_START,
  CHECK_STEP_LOAD_LABWARE,
  CHECK_STEP_PICK_UP_TIP,
  CHECK_STEP_CHECK_POINT_ONE,
  CHECK_STEP_CHECK_POINT_TWO,
  CHECK_STEP_CHECK_POINT_THREE,
  CHECK_STEP_CHECK_HEIGHT,
  CHECK_STEP_SESSION_EXIT,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
} from './constants'

export type RobotCalibrationCheckStep =
  | typeof CHECK_STEP_SESSION_START
  | typeof CHECK_STEP_LOAD_LABWARE
  | typeof CHECK_STEP_PICK_UP_TIP
  | typeof CHECK_STEP_CHECK_POINT_ONE
  | typeof CHECK_STEP_CHECK_POINT_TWO
  | typeof CHECK_STEP_CHECK_POINT_THREE
  | typeof CHECK_STEP_CHECK_HEIGHT
  | typeof CHECK_STEP_SESSION_EXIT
  | typeof CHECK_STEP_BAD_ROBOT_CALIBRATION
  | typeof CHECK_STEP_NO_PIPETTES_ATTACHED

export type RobotCalibrationCheckInstrument = {
  model: string,
  name: string,
  tip_length: number,
  mount_axis: number,
  plunger_axis: number,
  pipette_id: string,
}
export type RobotCalibrationCheckLabware = {
  alternatives: Array<string>,
  slot: string,
  id: string,
  forPipettes: Array<string>,
  loadName: string,
  namespace: string,
  version: number,
}

export type RobotCalibrationCheckSessionData = {|
  instruments: { [string]: RobotCalibrationCheckInstrument },
  currentStep: RobotCalibrationCheckStep,
  nextSteps: {
    links: { [RobotCalibrationCheckStep]: string },
  },
  labware: Array<RobotCalibrationCheckLabware>,
|}
