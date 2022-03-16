import { createSelector } from 'reselect'
import * as PipetteConstants from '../pipettes/constants'
import { getProtocolPipetteTipRackCalInfo } from '../pipettes'

import type { State } from '../types'
import type {
  CalibrationStatus,
  DeckCalibrationStatus,
  DeckCalibrationData,
  ProtocolCalibrationStatus,
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
  robotName: string | null
): DeckCalibrationData | null => {
  return robotName != null
    ? getCalibrationStatus(state, robotName)?.deckCalibration.data ?? null
    : null
}

export const getProtocolCalibrationComplete: (
  state: State,
  robotName: string
) => ProtocolCalibrationStatus = createSelector(
  getDeckCalibrationStatus,
  getProtocolPipetteTipRackCalInfo,
  (deckCalStatus, pipetteTipRackCalInfo) => {
    if (deckCalStatus !== 'OK') {
      return {
        complete: false,
        reason: 'calibrate_deck_failure_reason',
      }
    }
    let calibrationStatus: ProtocolCalibrationStatus = {
      complete: true,
    }
    const labwareCalInfoValues = Object.values(pipetteTipRackCalInfo)
    labwareCalInfoValues.forEach(pipette => {
      pipette?.tipRacks.forEach(tiprack => {
        if (tiprack.lastModifiedDate == null) {
          calibrationStatus = {
            complete: false,
            reason: 'calibrate_tiprack_failure_reason',
          }
        }
      })
    })
    labwareCalInfoValues.forEach(pipette => {
      if (pipette !== null && pipette.pipetteCalDate == null) {
        calibrationStatus = {
          complete: false,
          reason: 'calibrate_pipette_failure_reason',
        }
      }
    })
    labwareCalInfoValues.forEach(pipette => {
      const pipetteIsMatch =
        pipette?.exactPipetteMatch === PipetteConstants.MATCH ||
        pipette?.exactPipetteMatch === PipetteConstants.INEXACT_MATCH
      if (pipette !== null && !pipetteIsMatch) {
        calibrationStatus = {
          complete: false,
          reason: 'attach_pipette_failure_reason',
        }
      }
    })
    return calibrationStatus
  }
)
