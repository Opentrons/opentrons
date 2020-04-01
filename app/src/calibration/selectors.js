// @flow
import type { State } from '../types'
import type {
  RobotCalibrationCheckSessionData,
  RobotCalibrationCheckStep,
} from './api-types'

export const getRobotCalibrationCheckSession: (
  state: State,
  robotName: string
) => RobotCalibrationCheckSessionData | null = (state, robotName) =>
  state.calibration[robotName]?.robotCalibrationCheck ?? null

