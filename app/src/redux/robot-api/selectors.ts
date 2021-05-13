// @flow

import type { State } from '../types'
import * as Types from './types'

export const getRequestById = (
  state: State,
  id: string
): Types.RequestState | null => {
  return state.robotApi[id] || null
}

export const getRequests = (
  state: State,
  ids: $ReadOnlyArray<string>
): Array<Types.RequestState | null> => {
  return ids.map(id => getRequestById(state, id))
}
