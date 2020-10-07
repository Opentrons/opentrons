// @flow
// shell update substate
// TODO(mc, 2020-06-10): move to shell/actions and shell/selectors
import { createSelector } from 'reselect'

import type { State } from '../types'
import type { ShellUpdateAction, ShellUpdateState, UpdateInfo } from './types'

// command sent to app-shell via meta.shell === true
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

export function getShellUpdateState(state: State): ShellUpdateState {
  return state.shell.update
}

export function getShellUpdateInfo(state: State): UpdateInfo | null {
  return state.shell.update.info ?? null
}

export const getAvailableShellUpdate: State => string | null = createSelector(
  getShellUpdateState,
  state => (state.available && state.info ? state.info.version : null)
)
