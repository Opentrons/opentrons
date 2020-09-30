// @flow

import { head } from 'lodash'

import type { State } from '../../types'
import type { TipLengthCalibration } from '../api-types'

export const getTipLengthCalibrations: (
  state: State,
  robotName: string | null
) => Array<TipLengthCalibration> = (state, robotName) => {
  if (!robotName) {
    return []
  }
  const calibrations =
    state.calibration[robotName]?.tipLengthCalibrations?.data || []
  return calibrations.map(calibration => calibration.attributes)
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
  return (
    head(
      allCalibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
      )
    ) || null
  )
}
