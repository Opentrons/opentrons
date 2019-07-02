// @flow
// config redux module
import { setIn } from '@thi.ng/paths'
import remove from 'lodash/remove'

import { getShellConfig } from '../shell'

import type { State, Action, ThunkAction } from '../types'
import type { LogLevel } from '../logger'

type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | Array<string>

// TODO(mc, 2018-05-17): put this type somewhere common to app and app-shell
export type Config = {
  devtools: boolean,

  // app update config
  update: {
    channel: UpdateChannel,
  },

  // robot update config
  buildroot: {
    manifestUrl: string,
  },

  // logging config
  log: {
    level: {
      file: LogLevel,
      console: LogLevel,
    },
  },

  // ui and browser config
  ui: {
    width: number,
    height: number,
    url: {
      protocol: UrlProtocol,
      path: string,
    },
    webPreferences: {
      webSecurity: boolean,
    },
  },

  analytics: {
    appId: string,
    optedIn: boolean,
    seenOptIn: boolean,
  },

  // deprecated; remove with first migration
  p10WarningSeen: {
    [id: string]: ?boolean,
  },

  support: {
    userId: string,
    createdAt: number,
    name: string,
    email: ?string,
  },

  discovery: {
    candidates: DiscoveryCandidates,
  },

  // internal development flags
  devInternal?: {
    allPipetteConfig?: boolean,
    tempdeckControls?: boolean,
    enableThermocycler?: boolean,
    enablePipettePlus?: boolean,
    enableBuildRoot?: boolean,
  },
}

type UpdateConfigAction = {|
  type: 'config:UPDATE',
  payload: {|
    path: string,
    value: any,
  |},
  meta: {|
    shell: true,
  |},
|}

type SetConfigAction = {|
  type: 'config:SET',
  payload: {|
    path: string,
    value: any,
  |},
|}

export type ConfigAction = UpdateConfigAction | SetConfigAction

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
  // initial state
  // getShellConfig makes a sync RPC call, so use sparingly
  if (!state) return getShellConfig()

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
    remove(candidates, c => {
      return c === ip
    })
    return dispatch(updateConfig('discovery.candidates', candidates))
  }
}
