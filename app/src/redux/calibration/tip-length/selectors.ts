import { createSelector } from 'reselect'
import { head } from 'lodash'

import type { State } from '../../types'
import type { TipLengthCalibration } from '../api-types'

export const getTipLengthCalibrations: (
  state: State,
  robotName: string | null
) => TipLengthCalibration[] = (state, robotName) => {
  if (!robotName) {
    return []
  }
  const calibrations =
    state.calibration[robotName]?.tipLengthCalibrations?.data || []
  return calibrations
}

export const getTipLengthForPipetteAndTiprackByUri: (
  state: State,
  robotName: string | null,
  pipetteSerial: string,
  tiprackUri: string
) => TipLengthCalibration | null = createSelector(
  getTipLengthCalibrations,
  (allCalibrations, pipetteSerial, tipRackUri) => {
    return (
      head(
        allCalibrations.filter(
          cal => cal.pipette === pipetteSerial && cal.uri === tipRackUri
        )
      ) || null
    )
  }
)

export const filterTipLengthForPipetteAndTiprack: (
  allCalibrations: TipLengthCalibration[],
  pipetteSerial: string | null,
  tiprackHash: string | null
) => TipLengthCalibration | null = (
  allCalibrations,
  pipetteSerial,
  tiprackHash
) => {
  return (
    head(
      allCalibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
      )
    ) || null
  )
}

export const getTipLengthForPipetteAndTiprack: (
  state: State,
  robotName: string,
  pipetteSerial: string,
  tiprackHash: string
) => TipLengthCalibration | null = (
  state,
  robotName,
  pipetteSerial,
  tiprackHash
) => {
  const allCalibrations = getTipLengthCalibrations(state, robotName)
  return filterTipLengthForPipetteAndTiprack(
    allCalibrations,
    pipetteSerial,
    tiprackHash
  )
}

export const tipLengthExistsForPipetteAndTiprack: (
  calibrations: TipLengthCalibration[],
  pipetteSerial: string,
  tiprackHash: string
) => boolean = (calibrations, pipetteSerial, tiprackHash) => {
  const calibration = head(
    calibrations.filter(
      cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
    )
  )
  return !!calibration
}
