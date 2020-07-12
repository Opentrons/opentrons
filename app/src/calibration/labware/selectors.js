// @flow

import type { State } from '../../types'
import type { LabwareCalibrationObjects } from './../types'

export const getListOfLabwareCalibrations = (
  state: State,
  robotName: string
): Array<LabwareCalibrationObjects | null> | null => {
  return state.calibration[robotName]?.labwareCalibration?.data ?? null
}
