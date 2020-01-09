// @flow
import { combineReducers } from 'redux'

import { robotLogsReducer } from './robot-logs/reducer'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { ShellState, ShellUpdateState } from './types'

const INITIAL_STATE: ShellUpdateState = {
  checking: false,
  downloading: false,
  available: false,
  downloaded: false,
  seen: false,
  info: null,
  error: null,
}

// TODO(mc, 2020-01-07): move robot logs to own module and make this the root shell reducer
export function shellUpdateReducer(
  state: ShellUpdateState = INITIAL_STATE,
  action: Action
): ShellUpdateState {
  switch (action.type) {
    case 'shell:CHECK_UPDATE':
      return { ...state, checking: true, error: null }

    case 'shell:CHECK_UPDATE_RESULT':
      return { ...state, ...action.payload, checking: false }

    case 'shell:DOWNLOAD_UPDATE':
      return { ...state, downloading: true, seen: true, error: null }

    case 'shell:DOWNLOAD_UPDATE_RESULT':
      return {
        ...state,
        downloading: false,
        error: action.payload.error || null,
        downloaded: !action.payload.error,
      }

    case 'shell:SET_UPDATE_SEEN':
      return { ...state, seen: true, error: null }
  }

  return state
}

export const shellReducer: Reducer<ShellState, Action> = combineReducers<
  _,
  Action
>({
  update: shellUpdateReducer,
  robotLogs: robotLogsReducer,
})
