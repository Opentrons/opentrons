// @flow

import { head } from 'lodash'

import type { State } from '../../types'
import type { PipetteOffsetCalibration } from '../api-types'

export const getPipetteOffsetCalibrations: (
  state: State,
  robotName: string | null
) => Array<PipetteOffsetCalibration> = (state, robotName) => {
  if (!robotName) {
    return []
  }
  const calibrations =
    state.calibration[robotName]?.pipetteOffsetCalibrations?.data || []
  return calibrations
}

export const getCalibrationForPipette: (
  state: State,
  robotName: string,
  pipetteSerial: string
) => PipetteOffsetCalibration | null = (state, robotName, pipetteSerial) => {
  const allCalibrations = getPipetteOffsetCalibrations(state, robotName)
  return filterCalibrationForPipette(allCalibrations, pipetteSerial)
}

export const filterCalibrationForPipette: (
  calibrations: Array<PipetteOffsetCalibration>,
  pipetteSerial: string
) => PipetteOffsetCalibration | null = (calibrations, pipetteSerial) => {
  return head(calibrations.filter(cal => cal.pipette === pipetteSerial)) || null
}
