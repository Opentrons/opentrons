import * as Constants from './constants'

import type { RobotHost } from '../robot-api/types'
import type { ViewableRobot } from '../discovery/types'
import type {
  RobotUpdateAction,
  UpdateSessionStep,
  UpdateSessionStage,
  RobotUpdateStatusAction,
  RobotUpdateTarget,
} from './types'

// analytics tracking action; not consumed by any reducer
export function robotUpdateChangelogSeen(robotName: string): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_CHANGELOG_SEEN, meta: { robotName } }
}

// analytics tracking action; not consumed by any reducer
export function robotUpdateIgnored(robotName: string): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_UPDATE_IGNORED, meta: { robotName } }
}

export function startBuildrootPremigration(
  payload: RobotHost
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_START_PREMIGRATION,
    meta: { shell: true },
    payload,
  }
}

export function startRobotUpdate(
  robotName: string,
  systemFile: string | null = null
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_START_UPDATE,
    payload: { robotName, systemFile },
  }
}

export function createSession(
  host: RobotHost,
  sessionPath: string
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_CREATE_SESSION,
    payload: { host, sessionPath },
  }
}

export function createSessionSuccess(
  host: RobotHost,
  token: string,
  pathPrefix: string
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_CREATE_SESSION_SUCCESS,
    payload: { host, token, pathPrefix },
  }
}

export function robotUpdateStatus(
  stage: UpdateSessionStage,
  message: string,
  progress: number | null
): RobotUpdateStatusAction {
  return {
    type: Constants.ROBOTUPDATE_STATUS,
    payload: { stage, message, progress },
  }
}

export function readUserRobotUpdateFile(systemFile: string): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_READ_USER_FILE,
    payload: { systemFile },
    meta: { shell: true },
  }
}

export function readSystemRobotUpdateFile(
  target: RobotUpdateTarget
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_READ_SYSTEM_FILE,
    payload: { target },
    meta: { shell: true },
  }
}

export function uploadRobotUpdateFile(
  host: ViewableRobot,
  path: string,
  systemFile: string
): RobotUpdateAction {
  return {
    type: Constants.ROBOTUPDATE_UPLOAD_FILE,
    payload: { host, path, systemFile: systemFile },
    meta: { shell: true },
  }
}

export function setRobotUpdateSessionStep(
  payload: UpdateSessionStep
): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_SET_SESSION_STEP, payload }
}

export function clearRobotUpdateSession(): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_CLEAR_SESSION }
}

// TODO(mc, 2019-07-21): flesh this action out
export function unexpectedRobotUpdateError(message: string): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_UNEXPECTED_ERROR, payload: { message } }
}

export function setRobotUpdateSeen(robotName: string): RobotUpdateAction {
  return { type: Constants.ROBOTUPDATE_SET_UPDATE_SEEN, meta: { robotName } }
}
