// @flow

import type { State } from '../types'
import type {
  CalibrationStatus,
  DeckCalibrationStatus,
  DeckCalibrationData,
} from './types'

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
  return getCalibrationStatus(state, robotName)?.deckCalibration.status ?? null
}

export const getDeckCalibrationData = (
  state: State,
  robotName: string
): DeckCalibrationData | null => {
  return getCalibrationStatus(state, robotName)?.deckCalibration.data ?? null
}
