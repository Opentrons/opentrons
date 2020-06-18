// @flow

import type { State } from '../types'
import type { CalibrationStatus, DeckCalibrationStatus } from './types'

export const getCalibrationStatus = (
  state: State,
  robotName: string
): CalibrationStatus | null => {
  return state.calibration[robotName]?.calibrationStatus ?? null
}

export const getDeckCalibrationStatus = (
  state: State,
  robotName: string
): DeckCalibrationStatus | null => {
  return (
    state.calibration[robotName]?.calibrationStatus.deckCalibration.status ??
    null
  )
}
