import { reducer } from './reducer'
import type { State, Action } from './types'
import { createStore as createReduxStore } from 'redux'
import type { Store } from 'redux'

export * from './actions'
export * from './selectors'

export function createStore(): Store<State, Action> {
  return createReduxStore(reducer)
}
