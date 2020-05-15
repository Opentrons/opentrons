// @flow
import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'
import * as Types from './types'
import type { RobotCalibrationCheckSessionDetails } from './api-types'
import * as Constants from './constants'

export const completeRobotCalibrationCheck = (
  robotName: string
): Types.CompleteRobotCalibrationCheckAction => ({
  type: Constants.COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: { robotName },
})
