// @flow

import {
  ROBOT_CALIBRATION_STEPS
} from './constants'

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
} = ROBOT_CALIBRATION_STEPS

export type RobotCalibrationCheckStep =
  | SESSION_START
  | LOAD_LABWARE
  | PICK_UP_TIP
  | CHECK_POINT_ONE
  | CHECK_POINT_TWO
  | CHECK_POINT_THREE
  | CHECK_HEIGHT
  | SESSION_EXIT
  | BAD_ROBOT_CALIBRATION
  | NO_PIPETTES_ATTACHED

export type RobotCalibrationCheckSessionData = {|
  instruments: { [string]: string },
  currentStep: RobotCalibrationCheckStep,
  nextSteps: {
    links: { [RobotCalibrationCheckStep]: string },
  },
|}
