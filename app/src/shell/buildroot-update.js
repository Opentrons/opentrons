// @flow
import type { State } from '../types'

export type BuildrootUpdateInfo = {
  filename: ?string,
  apiVersion: ?string,
  serverVersion: ?string,
}

const {
  buildroot: { getBuildrootUpdateInfo, getUpdateFileContents },
} = global.APP_SHELL

export function buildrootUpdateReducer(state: ?BuildrootUpdateInfo) {
  if (!state) return getBuildrootUpdateInfo()
  return state
}

export function getBuildrootUpdateFilename(state: State): ?string {
  return state.shell.buildroot?.filename || null
}

export function getBuildrootApiUpdateVersion(state: State): ?string {
  return state.shell.buildroot?.apiVersion || null
}

export function getBuildrootServerUpdateVersion(state: State): ?string {
  return state.shell.buildroot?.serverVersion || null
}

// caution: this calls an Electron RPC remote, so use sparingly
export function getBuildrootUpdateContents(): Promise<Blob> {
  return getUpdateFileContents().then(contents => new Blob([contents]))
}
