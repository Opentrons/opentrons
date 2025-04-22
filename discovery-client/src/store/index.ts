import { createStore as createReduxStore } from 'redux'

import { reducer } from './reducer'

import type { Action, State } from './types'
import type { Store } from 'redux'

export * from './actions'
export * from './selectors'

export function createStore(): Store<State, Action> {
  return createReduxStore(reducer)
}
