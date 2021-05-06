import type { State } from '../../types'
import { SESSION_TYPE_TIP_LENGTH_CALIBRATION } from '../constants'
import type { Session, TipLengthCalibrationSession } from '../types'
import { getRobotSessionOfType } from '../selectors'

export const getTipLengthCalibrationSession: (
  state: State,
  robotName: string
) => TipLengthCalibrationSession | null = (state, robotName) => {
  const tipLengthSession: Session | null = getRobotSessionOfType(
    state,
    robotName,
    SESSION_TYPE_TIP_LENGTH_CALIBRATION
  )
  if (
    tipLengthSession &&
    tipLengthSession.sessionType === SESSION_TYPE_TIP_LENGTH_CALIBRATION
  ) {
    return tipLengthSession
  }
  return null
}
