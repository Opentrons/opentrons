// @flow
import semver from 'semver'
import type { State, Action } from '../types'

export type BuildrootUpdateInfo = {|
  version: string,
  releaseNotes: string,
|}

export type BuildrootState = {
  seen: boolean,
  downloadProgress: null,
  downloadError: string | null,
  info: BuildrootUpdateInfo | null,
}

export type BuildrootAction =
  | {| type: 'buildroot:DOWNLOAD_PROGRESS', payload: number |}
  | {| type: 'buildroot:DOWNLOAD_ERROR', payload: string |}
  | {| type: 'buildroot:UPDATE_INFO', payload: BuildrootUpdateInfo | null |}
  | {| type: 'buildroot:SET_UPDATE_SEEN' |}

export function setBuildrootUpdateSeen(): BuildrootAction {
  return { type: 'buildroot:SET_UPDATE_SEEN' }
}

export const INITIAL_STATE: BuildrootState = {
  seen: false,
  info: null,
  downloadProgress: null,
  downloadError: null,
}

export function buildrootReducer(
  state: BuildrootState = INITIAL_STATE,
  action: Action
) {
  switch (action.type) {
    case 'buildroot:UPDATE_INFO':
      return { ...state, info: action.payload }
    case 'buildroot:SET_UPDATE_SEEN':
      return { ...state, seen: true }
    case 'buildroot:DOWNLOAD_PROGRESS':
      return { ...state, downloadProgress: action.payload }
    case 'buildroot:DOWNLOAD_ERROR':
      return { ...state, downloadError: action.payload }
  }

  return state
}

export function getBuildrootUpdateInfo(
  state: State
): BuildrootUpdateInfo | null {
  return state.shell.buildroot.info || null
}

export function getBuildrootUpdateSeen(state: State): boolean {
  return state.shell.buildroot?.seen || false
}

export function getBuildrootDownloadProgress(state: State): number | null {
  return state.shell.buildroot.downloadProgress || null
}

export function getBuildrootDownloadError(state: State): string | null {
  return state.shell.buildroot.downloadError || null
}

// TODO(mc, 2019-07-08): because of the size of this file, we should have
// update request streamed directly from the main process. Remove this
// commented out function when we have that in place
// export function getBuildrootUpdateContents(): Promise<Blob> {
//   return getUpdateFileContents().then(contents => new Blob([contents]))
// }

const compareCurrentVersionToUpdate = (
  currentVersion: ?string,
  updateVersion: string
): boolean => {
  const current = semver.valid(currentVersion)
  if (!current) return false

  if (current && semver.gt(updateVersion, currentVersion)) {
    return true
  }
  return false
}

export function getBuildrootUpdateAvailable(
  state: State,
  currentVersion: string
): boolean {
  const updateVersion = getBuildrootUpdateInfo(state)?.version
  if (currentVersion && updateVersion) {
    return compareCurrentVersionToUpdate(currentVersion, updateVersion)
  }
  return false
}
