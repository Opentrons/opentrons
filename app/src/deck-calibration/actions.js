// @flow
import type { StartDeckCalibrationCheckAction } from './types'
import { START_CHECK } from './constants'

export const startDeckCalibrationCheck = (robotName: string): StartDeckCalibrationCheckAction => ({
  type: START_CHECK,
  meta: { robotName },
})
