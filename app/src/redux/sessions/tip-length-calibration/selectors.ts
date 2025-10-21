import { SESSION_TYPE_TIP_LENGTH_CALIBRATION } from '../constants'
import { getRobotSessionOfType } from '../selectors'

import type { State } from '../../types'
import type { Session, TipLengthCalibrationSession } from '../types'

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
