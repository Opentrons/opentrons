// @flow
// shell update substate
import {createSelector} from 'reselect'

import type {OutputSelector} from 'reselect'
import type {State, Action, Error} from '../types'

export type UpdateInfo = {
  version: string,
  files: Array<{sha512: string, url: string}>,
  releaseDate: string,
  releaseNotes?: string,
}

export type ShellUpdateState = {
  checking: boolean,
  downloading: boolean,
  available: boolean,
  downloaded: boolean,
  error: ?Error,
  seen: boolean,
  info: ?UpdateInfo,
}

export type ShellUpdateAction =
  | {|type: 'shell:CHECK_UPDATE', meta: {|shell: true|}|}
  | {|
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: {|available?: boolean, info?: UpdateInfo, error?: Error|},
    |}
  | {|type: 'shell:DOWNLOAD_UPDATE', meta: {|shell: true|}|}
  | {|type: 'shell:DOWNLOAD_UPDATE_RESULT', payload: {|error?: Error|}|}
  | {|type: 'shell:APPLY_UPDATE', meta: {|shell: true|}|}
  | {|type: 'shell:SET_UPDATE_SEEN'|}

// command sent to app-shell via meta.shell === true
export function checkShellUpdate (): ShellUpdateAction {
  return {type: 'shell:CHECK_UPDATE', meta: {shell: true}}
}

// command sent to app-shell via meta.shell === true
export function downloadShellUpdate (): ShellUpdateAction {
  return {type: 'shell:DOWNLOAD_UPDATE', meta: {shell: true}}
}

// command sent to app-shell via meta.shell === true
export function applyShellUpdate (): ShellUpdateAction {
  return {type: 'shell:APPLY_UPDATE', meta: {shell: true}}
}

export function setShellUpdateSeen (): ShellUpdateAction {
  return {type: 'shell:SET_UPDATE_SEEN'}
}

const INITIAL_STATE: ShellUpdateState = {
  checking: false,
  downloading: false,
  available: false,
  downloaded: false,
  seen: false,
  info: null,
  error: null,
}

export function updateReducer (
  state: ShellUpdateState = INITIAL_STATE,
  action: Action
): ShellUpdateState {
  switch (action.type) {
    case 'shell:CHECK_UPDATE':
      return {...state, checking: true, error: null}

    case 'shell:CHECK_UPDATE_RESULT':
      return {...state, ...action.payload, checking: false}

    case 'shell:DOWNLOAD_UPDATE':
      return {...state, downloading: true, seen: true, error: null}

    case 'shell:DOWNLOAD_UPDATE_RESULT':
      return {
        ...state,
        downloading: false,
        error: action.payload.error || null,
        downloaded: !action.payload.error,
      }

    case 'shell:SET_UPDATE_SEEN':
      return {...state, seen: true, error: null}
  }

  return state
}

type StringSelector = OutputSelector<State, void, ?string>

export function getShellUpdateState (state: State): ShellUpdateState {
  return state.shell.update
}

export const getAvailableShellUpdate: StringSelector = createSelector(
  getShellUpdateState,
  state => (state.available && state.info ? state.info.version : null)
)
