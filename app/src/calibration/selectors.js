// @flow
import type { State } from '../types'
import type { RobotCalibrationCheckSessionData } from './api-types'

export const getRobotCalibrationCheckSession: (
  state: State,
  robotName: string
) => ?RobotCalibrationCheckSessionData = (state, robotName) =>
  state.calibration[robotName]?.robotCalibrationCheck || null
