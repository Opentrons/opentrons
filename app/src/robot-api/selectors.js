// @flow

import type { State } from '../types'
import type { RequestState } from './types'

export const getRequestById = (
  state: State,
  id: string
): RequestState | null => {
  return state.robotApi[id] || null
}

export const getRequests = (
  state: State,
  ids: $ReadOnlyArray<string>
): Array<RequestState | null> => {
  return ids.map(id => getRequestById(state, id))
}
