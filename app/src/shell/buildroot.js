// @flow
import semver from 'semver'
import remote from './remote'
import type { State, Action } from '../types'

export type BuildrootUpdateInfo = {|
  filename: string,
  apiVersion: string,
  serverVersion: string,
|}

export type BuildrootState = {
  seen: boolean,
  info: BuildrootUpdateInfo | null,
}

const {
  buildroot: { getUpdateFileContents },
} = remote

export type BuildrootAction =
  | {| type: 'buildroot:UPDATE_INFO', payload: BuildrootUpdateInfo | null |}
  | {| type: 'buildroot:SET_UPDATE_SEEN' |}

export function setBuildrootUpdateSeen(): BuildrootAction {
  return { type: 'buildroot:SET_UPDATE_SEEN' }
}

const INITIAL_STATE = {
  seen: false,
  info: null,
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

// caution: this calls an Electron RPC remote, so use sparingly
export function getBuildrootUpdateContents(): Promise<Blob> {
  return getUpdateFileContents().then(contents => new Blob([contents]))
}

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
  const updateVersion = getBuildrootUpdateInfo(state)?.apiVersion
  if (currentVersion && updateVersion) {
    return compareCurrentVersionToUpdate(currentVersion, updateVersion)
  }
  return false
}
