// @flow
import { createStore as createReduxStore } from 'redux'

import { reducer } from './reducer'

import type { Store } from 'redux'
import type { State, Action, Dispatch } from './types'

export * from './actions'
export * from './selectors'

export function createStore(): Store<State, Action, Dispatch> {
  return createReduxStore(reducer)
}
