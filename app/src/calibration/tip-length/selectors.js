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
    state.calibration[robotName]?.pipetteOffsetCalibrations?.data || []
  return calibrations.map(calibration => calibration.attributes)
}

export const getCalibrationForPipette: (
  state: State,
  robotName: string,
  pipetteSerial: string
) => TipLengthCalibration | null = (state, robotName, pipetteSerial) => {
  const allCalibrations = getTipLengthCalibrations(state, robotName)
  return (
    head(allCalibrations.filter(cal => cal.pipette === pipetteSerial)) || null
  )
}
