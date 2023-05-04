import type { State } from '../../types'
import { SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION } from '../constants'
import { getRobotSessionOfType } from '../selectors'
import type { Session, PipetteOffsetCalibrationSession } from '../types'

export const getPipetteOffsetCalibrationSession: (
  state: State,
  robotName: string
) => PipetteOffsetCalibrationSession | null = (state, robotName) => {
  const pipetteOffsetSession: Session | null = getRobotSessionOfType(
    state,
    robotName,
    SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
  )
  if (
    pipetteOffsetSession &&
    pipetteOffsetSession.sessionType === SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
  ) {
    return pipetteOffsetSession
  }
  return null
}
