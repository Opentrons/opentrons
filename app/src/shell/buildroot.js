// @flow
import type { State } from '../types'

export type BuildrootUpdateInfo = {|
  filename: string,
  apiVersion: string,
  serverVersion: string,
|}

const {
  buildroot: {
    getBuildrootUpdateInfo: getBuildrootInitialState,
    getUpdateFileContents,
  },
} = global.APP_SHELL

export function buildrootReducer(state: ?BuildrootUpdateInfo) {
  if (state === undefined) return getBuildrootInitialState()
  return state
}

export function getBuildrootUpdateInfo(
  state: State
): BuildrootUpdateInfo | null {
  return state.shell.buildroot || null
}

// caution: this calls an Electron RPC remote, so use sparingly
export function getBuildrootUpdateContents(): Promise<Blob> {
  return getUpdateFileContents().then(contents => new Blob([contents]))
}
