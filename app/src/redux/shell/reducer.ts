import { combineReducers } from 'redux'

import { robotLogsReducer } from './robot-logs/reducer'

import type { Action } from '../types'
import type { ShellUpdateState } from './types'

const INITIAL_STATE: ShellUpdateState = {
  checking: false,
  downloading: false,
  available: false,
  downloaded: false,
  info: null,
  error: null,
}

// TODO(mc, 2020-01-07): move robot logs to own module and make this the root shell reducer
export function shellUpdateReducer(
  state: ShellUpdateState = INITIAL_STATE,
  action: Action
): ShellUpdateState {
  switch (action.type) {
    case 'shell:CHECK_UPDATE': {
      return { ...state, checking: true, error: null }
    }

    case 'shell:CHECK_UPDATE_RESULT': {
      return { ...state, ...action.payload, checking: false }
    }

    case 'shell:DOWNLOAD_UPDATE': {
      return { ...state, downloading: true, error: null }
    }

    case 'shell:DOWNLOAD_UPDATE_RESULT': {
      return {
        ...state,
        downloading: false,
        error: action.payload.error || null,
        downloaded: !action.payload.error,
      }
    }
  }

  return state
}
// TODO: (sa 2021-15-18: remove any typed state in combineReducers)
export const shellReducer = combineReducers<any, Action>({
  update: shellUpdateReducer,
  robotLogs: robotLogsReducer,
})
