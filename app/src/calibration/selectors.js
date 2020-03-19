// @flow
import type { State } from '../types'
import type { DeckCheckSessionData } from './api-types'

export const getDeckCheckSession: (
  state: State,
  robotName: string | null
) => DeckCheckSessionData = (state, robotName) =>
  robotName !== null ? state.calibration[robotName]?.deckCheck : {}
