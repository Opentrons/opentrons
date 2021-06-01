import type { State } from '../../types'
import { SESSION_TYPE_DECK_CALIBRATION } from '../constants'
import type { Session, DeckCalibrationSession } from '../types'
import { getRobotSessionOfType } from '../selectors'

export const getDeckCalibrationSession: (
  state: State,
  robotName: string
) => DeckCalibrationSession | null = (state, robotName) => {
  const deckSession: Session | null = getRobotSessionOfType(
    state,
    robotName,
    SESSION_TYPE_DECK_CALIBRATION
  )
  if (
    deckSession &&
    deckSession.sessionType === SESSION_TYPE_DECK_CALIBRATION
  ) {
    return deckSession
  }
  return null
}
