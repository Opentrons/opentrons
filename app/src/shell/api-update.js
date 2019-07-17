// @flow
import remote from './remote'
import type { State } from '../types'

export type ApiUpdateInfo = {
  filename: string,
  version: string,
}

const {
  apiUpdate: { getUpdateInfo, getUpdateFileContents },
  update: { CURRENT_VERSION },
} = remote

export function apiUpdateReducer(state: ?ApiUpdateInfo) {
  if (!state) return getUpdateInfo()
  return state
}

export function getApiUpdateFilename(state: State): string {
  return state.shell.apiUpdate.filename
}

export function getApiUpdateVersion(state: State): string {
  if (state.config?.devInternal?.enableBuildRoot) {
    return CURRENT_VERSION
  }
  return state.shell.apiUpdate.version
}

// caution: this calls an Electron RPC remote, so use sparingly
export function getApiUpdateContents(): Promise<Blob> {
  return getUpdateFileContents().then(contents => new Blob([contents]))
}
