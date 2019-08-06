// @flow
// config redux module
import { setIn } from '@thi.ng/paths'
import remove from 'lodash/remove'

import remote from '../shell/remote'

import type { State, Action, ThunkAction } from '../types'
import type { Config, UpdateConfigAction } from './types'

export * from './types'

// trigger a config value update to the app-shell via shell middleware
export function updateConfig(path: string, value: any): UpdateConfigAction {
  return {
    type: 'config:UPDATE',
    payload: { path, value },
    meta: { shell: true },
  }
}

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

export function getConfig(state: State): Config {
  return state.config
}

export function toggleDevTools(): ThunkAction {
  return (dispatch, getState) => {
    const devToolsOn = getConfig(getState()).devtools
    return dispatch(updateConfig('devtools', !devToolsOn))
  }
}

export function addManualIp(ip: string): ThunkAction {
  return (dispatch, getState) => {
    const candidates = getConfig(getState()).discovery.candidates
    const previous: ?string = [].concat(candidates).find(i => i === ip)
    let nextCandidatesList = candidates
    if (!previous) nextCandidatesList = nextCandidatesList.concat(ip)

    return dispatch(updateConfig('discovery.candidates', nextCandidatesList))
  }
}

export function removeManualIp(ip: string): ThunkAction {
  return (dispatch, getState) => {
    const candidates = [].concat(getConfig(getState()).discovery.candidates)

    remove(candidates, c => c === ip)

    return dispatch(updateConfig('discovery.candidates', candidates))
  }
}
