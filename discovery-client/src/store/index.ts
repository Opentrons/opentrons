import { createStore as createReduxStore } from 'redux'

import { reducer } from './reducer'

import type { Store } from 'redux'
import type { Action, State } from './types'

export * from './actions'
export * from './selectors'

export function createStore(): Store<State, Action> {
  return createReduxStore(reducer)
}
