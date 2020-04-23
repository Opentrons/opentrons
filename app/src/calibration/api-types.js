// @flow

import {
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_PREPARING_PIPETTE,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_CHECKING_POINT_ONE,
  CHECK_STEP_CHECKING_POINT_TWO,
  CHECK_STEP_CHECKING_POINT_THREE,
  CHECK_STEP_CHECKING_HEIGHT,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
} from './constants'

export type RobotCalibrationCheckStep =
  | typeof CHECK_STEP_SESSION_STARTED
  | typeof CHECK_STEP_LABWARE_LOADED
  | typeof CHECK_STEP_PREPARING_PIPETTE
  | typeof CHECK_STEP_INSPECTING_TIP
  | typeof CHECK_STEP_CHECKING_POINT_ONE
  | typeof CHECK_STEP_CHECKING_POINT_TWO
  | typeof CHECK_STEP_CHECKING_POINT_THREE
  | typeof CHECK_STEP_CHECKING_HEIGHT
  | typeof CHECK_STEP_SESSION_EXITED
  | typeof CHECK_STEP_BAD_ROBOT_CALIBRATION
  | typeof CHECK_STEP_NO_PIPETTES_ATTACHED

export type RobotCalibrationCheckInstrument = {
  model: string,
  name: string,
  tip_length: number,
  mount_axis: string,
  plunger_axis: string,
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
