// shell update substate
// TODO(mc, 2020-06-10): move to shell/actions and shell/selectors
import { createSelector } from 'reselect'

import type { State } from '../types'
import type { ShellUpdateAction, ShellUpdateState } from './types'

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

export function getShellUpdateState(state: State): ShellUpdateState {
  return state.shell.update
}

export function getShellUpdateDataFiles(state: State): string[] {
  return state.shell.filePaths
}

export const getAvailableShellUpdate: (state: State) => string | null =
  createSelector(getShellUpdateState, state =>
    state.available && state.info ? state.info.version : null
  )

export function getShellUsbMountPaths(state: State): string[] {
  return state.shell.usbMountPaths.map(entry => entry.path)
}

// Only mounts whose backing device is a single-function USB mass-storage device
export function getShellUsbMassStorageMountPaths(state: State): string[] {
  return state.shell.usbMountPaths.reduce<string[]>((acc, entry) => {
    return entry.isMassStorage ? [...acc, entry.path] : acc
  }, [])
}
