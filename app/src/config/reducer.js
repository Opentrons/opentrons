// @flow

import { setIn } from '@thi.ng/paths'
import { remote } from '../shell/remote'

import type { Action } from '../types'
import type { Config } from './types'

// config reducer
export function configReducer(state: ?Config, action: Action): Config {
  // initial state from app-shell preloaded remote
  if (!state) return remote.INITIAL_CONFIG

  switch (action.type) {
    case 'config:SET':
      return setIn(state, action.payload.path, action.payload.value)
  }

  return state
}
