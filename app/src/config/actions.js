// @flow
import remove from 'lodash/remove'

import { UPDATE, RESET } from './constants'
import { getConfig } from './selectors'

import type { ThunkAction } from '../types'
import type {
  UpdateConfigAction,
  ResetConfigAction,
  DevInternalFlag,
} from './types'

// trigger a config value update via the app-shell via shell middleware
export const updateConfig = (path: string, value: any): UpdateConfigAction => ({
  type: UPDATE,
  payload: { path, value },
  meta: { shell: true },
})

// trigger a config value reset via the app-shell via shell middleware
export const resetConfig = (path: string): ResetConfigAction => ({
  type: RESET,
  payload: { path },
  meta: { shell: true },
})

// TODO(mc, 2020-02-05): move to `shell` module
export function toggleDevTools(): ThunkAction {
  return (dispatch, getState) => {
    const devToolsOn = getConfig(getState()).devtools
    return dispatch(updateConfig('devtools', !devToolsOn))
  }
}

export function toggleDevInternalFlag(flag: DevInternalFlag): ThunkAction {
  return (dispatch, getState) => {
    const devInternal = getConfig(getState()).devInternal
    const isFlagOn = devInternal ? devInternal[flag] : false
    return dispatch(updateConfig(`devInternal.${flag}`, !isFlagOn))
  }
}

export function toggleDiscoveryCache(): ThunkAction {
  return (dispatch, getState) => {
    const cacheDisabled = getConfig(getState()).discovery.disableCache
    return dispatch(updateConfig('discovery.disableCache', !cacheDisabled))
  }
}
// TODO(mc, 2020-02-05): move to `discovery` module
export function addManualIp(ip: string): ThunkAction {
  return (dispatch, getState) => {
    const candidates = getConfig(getState()).discovery.candidates
    const previous: ?string = [].concat(candidates).find(i => i === ip)
    let nextCandidatesList = candidates
    if (!previous) nextCandidatesList = nextCandidatesList.concat(ip)

    return dispatch(updateConfig('discovery.candidates', nextCandidatesList))
  }
}

// TODO(mc, 2020-02-05): move to `discovery` module
export function removeManualIp(ip: string): ThunkAction {
  return (dispatch, getState) => {
    const candidates = [].concat(getConfig(getState()).discovery.candidates)

    remove(candidates, c => c === ip)

    return dispatch(updateConfig('discovery.candidates', candidates))
  }
}
