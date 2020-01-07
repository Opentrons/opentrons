// @flow
// shell update substate
import { createSelector } from 'reselect'

import type { State } from '../types'
import type { ShellUpdateAction, ShellUpdateState } from './types'

// command sent to app-shell via meta.shell === true
// TODO(mc, 2019-11-25): refactor this action to be shell:INITIALIZE
// it is used for more than just initial update checking
export function checkShellUpdate(): ShellUpdateAction {
  return { type: 'shell:CHECK_UPDATE', meta: { shell: true } }
}

// command sent to app-shell via meta.shell === true
export function downloadShellUpdate(): ShellUpdateAction {
  return { type: 'shell:DOWNLOAD_UPDATE', meta: { shell: true } }
}

// command sent to app-shell via meta.shell === true
export function applyShellUpdate(): ShellUpdateAction {
  return { type: 'shell:APPLY_UPDATE', meta: { shell: true } }
}

export function setShellUpdateSeen(): ShellUpdateAction {
  return { type: 'shell:SET_UPDATE_SEEN' }
}

type StringSelector = State => ?string

export function getShellUpdateState(state: State): ShellUpdateState {
  return state.shell.update
}

export const getAvailableShellUpdate: StringSelector = createSelector(
  getShellUpdateState,
  state => (state.available && state.info ? state.info.version : null)
)
