// @flow
import typeof { COMPLETE_ROBOT_CALIBRATION_CHECK } from './constants'

export type CompleteRobotCalibrationCheckAction = {|
  type: COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: {| robotName: string |},
|}

export type CalibrationAction = CompleteRobotCalibrationCheckAction
