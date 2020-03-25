// @flow
import type { State } from '../types'
import type { RobotCalibrationCheckSessionData } from './api-types'

export const getRobotCalibrationCheckSession: (
  state: State,
  robotName: string | null
) => ?RobotCalibrationCheckSessionData = (state, robotName) =>
  robotName !== null ? state.calibration[robotName]?.robotCalibrationCheck : null
