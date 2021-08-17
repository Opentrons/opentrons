import { createSelector } from 'reselect'
import type { State } from '../types'
import * as PipetteConstants from '../pipettes/constants'
import { getProtocolPipetteTipRackCalInfo } from '../pipettes'

import type {
  CalibrationStatus,
  DeckCalibrationStatus,
  DeckCalibrationData,
  ProtocolCalibration,
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

export const getProtocolCalibrationComplete: (
  state: State,
  robotName: string
) => ProtocolCalibration = createSelector(
  getDeckCalibrationStatus,
  getProtocolPipetteTipRackCalInfo,
  (deckCalStatus, pipetteTipRackCalInfo) => {
    if (deckCalStatus !== 'OK') {
      return {
        complete: false,
        reason: 'calibrate deck',
      }
    }
    const labwareCalInfoValues = Object.values(pipetteTipRackCalInfo)
    labwareCalInfoValues.forEach(pipette => {
      if (
        (pipette !== null &&
          pipette.exactPipetteMatch !== PipetteConstants.MATCH) ||
        (pipette !== null &&
          pipette.exactPipetteMatch !== PipetteConstants.INEXACT_MATCH)
      ) {
        return {
          complete: false,
          reason: 'attach pipette',
        }
      }
    })
    labwareCalInfoValues.forEach(pipette => {
      if (pipette !== null && pipette.pipetteCalDate == null) {
        return {
          complete: false,
          reason: 'calibrate pipette',
        }
      }
    })
    labwareCalInfoValues.forEach(pipette => {
      pipette?.tipRacks.forEach(tiprack => {
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
