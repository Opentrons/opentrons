// @flow

import { ROBOT_CALIBRATION_CHECK_STEPS } from './constants'

const {
  SESSION_START,
  LOAD_LABWARE,
  PICK_UP_TIP,
  CHECK_POINT_ONE,
  CHECK_POINT_TWO,
  CHECK_POINT_THREE,
  CHECK_HEIGHT,
  SESSION_EXIT,
  BAD_ROBOT_CALIBRATION,
  NO_PIPETTES_ATTACHED,
} = ROBOT_CALIBRATION_CHECK_STEPS

export type RobotCalibrationCheckStep =
  | typeof SESSION_START
  | typeof LOAD_LABWARE
  | typeof PICK_UP_TIP
  | typeof CHECK_POINT_ONE
  | typeof CHECK_POINT_TWO
  | typeof CHECK_POINT_THREE
  | typeof CHECK_HEIGHT
  | typeof SESSION_EXIT
  | typeof BAD_ROBOT_CALIBRATION
  | typeof NO_PIPETTES_ATTACHED

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
