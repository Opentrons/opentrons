// @flow
import type { RobotHost } from '../robot-api/types'
import type { BuildrootAction, UpdateSessionStep } from './types'

export const BR_UPDATE_VERSION: 'buildroot:UPDATE_VERSION' =
  'buildroot:UPDATE_VERSION'

export const BR_UPDATE_INFO: 'buildroot:UPDATE_INFO' = 'buildroot:UPDATE_INFO'

export const BR_USER_FILE_INFO: 'buildroot:USER_FILE_INFO' =
  'buildroot:USER_FILE_INFO'

export const BR_DOWNLOAD_PROGRESS: 'buildroot:DOWNLOAD_PROGRESS' =
  'buildroot:DOWNLOAD_PROGRESS'

export const BR_DOWNLOAD_ERROR: 'buildroot:DOWNLOAD_ERROR' =
  'buildroot:DOWNLOAD_ERROR'

export const BR_SET_UPDATE_SEEN: 'buildroot:SET_UPDATE_SEEN' =
  'buildroot:SET_UPDATE_SEEN'

export const BR_CHANGELOG_SEEN: 'buildroot:CHANGELOG_SEEN' =
  'buildroot:CHANGELOG_SEEN'

export const BR_UPDATE_IGNORED: 'buildroot:UPDATE_IGNORED' =
  'buildroot:UPDATE_IGNORED'

export const BR_START_PREMIGRATION: 'buildroot:START_PREMIGRATION' =
  'buildroot:START_PREMIGRATION'

export const BR_PREMIGRATION_DONE: 'buildroot:PREMIGRATION_DONE' =
  'buildroot:PREMIGRATION_DONE'

export const BR_PREMIGRATION_ERROR: 'buildroot:PREMIGRATION_ERROR' =
  'buildroot:PREMIGRATION_ERROR'

export const BR_START_UPDATE: 'buildroot:START_UPDATE' =
  'buildroot:START_UPDATE'

export const BR_READ_USER_FILE: 'buildroot:READ_USER_FILE' =
  'buildroot:READ_USER_FILE'

export const BR_UPLOAD_FILE: 'buildroot:UPLOAD_FILE' = 'buildroot:UPLOAD_FILE'

export const BR_FILE_UPLOAD_DONE: 'buildroot:FILE_UPLOAD_DONE' =
  'buildroot:FILE_UPLOAD_DONE'

export const BR_CLEAR_SESSION: 'buildroot:CLEAR_SESSION' =
  'buildroot:CLEAR_SESSION'

export const BR_UNEXPECTED_ERROR: 'buildroot:UNEXPECTED_ERROR' =
  'buildroot:UNEXPECTED_ERROR'

export const BR_SET_SESSION_STEP: 'buildroot:SET_SESSION_STEP' =
  'buildroot:SET_SESSION_STEP'

export function setBuildrootUpdateSeen(robotName: string): BuildrootAction {
  return { type: BR_SET_UPDATE_SEEN, meta: { robotName } }
}

// analytics tracking action; not consumed by any reducer
export function buildrootChangelogSeen(robotName: string): BuildrootAction {
  return { type: BR_CHANGELOG_SEEN, meta: { robotName } }
}

// analytics tracking action; not consumed by any reducer
export function buildrootUpdateIgnored(robotName: string): BuildrootAction {
  return { type: BR_UPDATE_IGNORED, meta: { robotName } }
}

export function startBuildrootPremigration(
  payload: RobotHost
): BuildrootAction {
  return { type: BR_START_PREMIGRATION, meta: { shell: true }, payload }
}

export function startBuildrootUpdate(
  robotName: string,
  systemFile: string | null = null
): BuildrootAction {
  return {
    type: BR_START_UPDATE,
    payload: { robotName, systemFile },
  }
}

export function readUserBuildrootFile(systemFile: string) {
  return {
    type: BR_READ_USER_FILE,
    payload: { systemFile },
    meta: { shell: true },
  }
}

export function uploadBuildrootFile(
  host: RobotHost,
  path: string,
  systemFile: string | null
): BuildrootAction {
  return {
    type: BR_UPLOAD_FILE,
    payload: { host, path, systemFile: systemFile },
    meta: { shell: true },
  }
}

export function setBuildrootSessionStep(
  payload: UpdateSessionStep
): BuildrootAction {
  return { type: BR_SET_SESSION_STEP, payload }
}

export function clearBuildrootSession(): BuildrootAction {
  return { type: BR_CLEAR_SESSION }
}

// TODO(mc, 2019-07-21): flesh this action out
export function unexpectedBuildrootError(message: string): BuildrootAction {
  return { type: BR_UNEXPECTED_ERROR, payload: { message } }
}
