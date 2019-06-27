// @flow
import semver from 'semver'
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

// TODO (ka 2019-6-27): These types are the same as in http-api-update server
// Once feature flag removed, swap out all instances of the server version with these

export type RobotUpdateType = 'upgrade' | 'downgrade' | null

export type RobotUpdateInfo = { version: string, type: RobotUpdateType }

const {
  buildroot: { getUpdateFileContents },
} = global.APP_SHELL

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

export function getUpdateInfo(
  appVersion: string,
  robotVersion: string
): RobotUpdateInfo {
  const current = semver.valid(robotVersion)
  let type = null
  if (current && semver.gt(appVersion, robotVersion)) {
    type = 'upgrade'
  } else if (current && semver.lt(appVersion, robotVersion)) {
    type = 'downgrade'
  }
  return { version: appVersion, type: type }
}
