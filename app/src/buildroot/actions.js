// @flow
import type { RobotHost } from '../robot-api/types'
import * as Constants from './constants'
import type {
  BuildrootAction,
  UpdateSessionStage,
  UpdateSessionStep,
} from './types'

export function setBuildrootUpdateSeen(robotName: string): BuildrootAction {
  return { type: Constants.BR_SET_UPDATE_SEEN, meta: { robotName } }
}

// analytics tracking action; not consumed by any reducer
export function buildrootChangelogSeen(robotName: string): BuildrootAction {
  return { type: Constants.BR_CHANGELOG_SEEN, meta: { robotName } }
}

// analytics tracking action; not consumed by any reducer
export function buildrootUpdateIgnored(robotName: string): BuildrootAction {
  return { type: Constants.BR_UPDATE_IGNORED, meta: { robotName } }
}

export function startBuildrootPremigration(
  payload: RobotHost
): BuildrootAction {
  return {
    type: Constants.BR_START_PREMIGRATION,
    meta: { shell: true },
    payload,
  }
}

export function startBuildrootUpdate(
  robotName: string,
  systemFile: string | null = null
): BuildrootAction {
  return {
    type: Constants.BR_START_UPDATE,
    payload: { robotName, systemFile },
  }
}

export function createSession(
  host: RobotHost,
  sessionPath: string
): BuildrootAction {
  return { type: Constants.BR_CREATE_SESSION, payload: { host, sessionPath } }
}

export function createSessionSuccess(
  host: RobotHost,
  token: string,
  pathPrefix: string
): BuildrootAction {
  return {
    type: Constants.BR_CREATE_SESSION_SUCCESS,
    payload: { host, token, pathPrefix },
  }
}

export function buildrootStatus(
  stage: UpdateSessionStage,
  message: string,
  progress: number | null
): BuildrootAction {
  return { type: Constants.BR_STATUS, payload: { stage, message, progress } }
}

export function readUserBuildrootFile(systemFile: string): BuildrootAction {
  return {
    type: Constants.BR_READ_USER_FILE,
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
    type: Constants.BR_UPLOAD_FILE,
    payload: { host, path, systemFile: systemFile },
    meta: { shell: true },
  }
}

export function setBuildrootSessionStep(
  payload: UpdateSessionStep
): BuildrootAction {
  return { type: Constants.BR_SET_SESSION_STEP, payload }
}

export function clearBuildrootSession(): BuildrootAction {
  return { type: Constants.BR_CLEAR_SESSION }
}

// TODO(mc, 2019-07-21): flesh this action out
export function unexpectedBuildrootError(message: string): BuildrootAction {
  return { type: Constants.BR_UNEXPECTED_ERROR, payload: { message } }
}
