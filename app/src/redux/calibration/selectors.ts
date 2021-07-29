import { createSelector } from 'reselect'
import type { State } from '../types'
import * as PipetteConstants from '../pipettes/constants'
import { getProtocolPipetteCalibrationInfo } from '../pipettes'

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

export interface ProtocolCalibration {
  complete: boolean
  reason?: string
}

export const getProtocolCalibrationComplete: (
  state: State,
  robotName: string
) => ProtocolCalibration = createSelector(
  getDeckCalibrationStatus,
  getProtocolPipetteCalibrationInfo,
  (deckCalStatus, protocolCalStatus) => {
    if (deckCalStatus !== 'OK') {
      return {
        complete: false,
        reason: 'calibrate deck',
      }
    }
    Object.values(protocolCalStatus).forEach(pipette => {
      if (
        pipette.exactMatch !== PipetteConstants.MATCH ||
        pipette.exactMatch !== PipetteConstants.INEXACT_MATCH
      ) {
        return {
          complete: false,
          reason: 'attach pipette',
        }
      } else if (pipette.lastModifiedDate == null) {
        return {
          complete: false,
          reason: 'calibrate pipette',
        }
      }
      pipette.tipRacks.forEach(tiprack => {
        if (tiprack.lastModifiedDate == null) {
          return {
            complete: false,
            reason: 'calibrate tiprack',
          }
        }
      })
    })
    return { complete: true }
  }
)
