import { head } from 'lodash'

import type { State } from '../../types'
import type { PipetteOffsetCalibration } from '../api-types'

export const getPipetteOffsetCalibrations: (
  state: State,
  robotName: string | null
) => PipetteOffsetCalibration[] = (state, robotName) => {
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
  pipetteSerial: string,
  mount: string | null
) => PipetteOffsetCalibration | null = (
  state,
  robotName,
  pipetteSerial,
  mount
) => {
  const allCalibrations = getPipetteOffsetCalibrations(state, robotName)
  return filterCalibrationForPipette(allCalibrations, pipetteSerial, mount)
}

export const filterCalibrationForPipette: (
  calibrations: PipetteOffsetCalibration[],
  pipetteSerial: string,
  mount: string | null
) => PipetteOffsetCalibration | null = (calibrations, pipetteSerial, mount) => {
  return (
    head(
      calibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.mount === mount
      )
    ) || null
  )
}
