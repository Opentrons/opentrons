import type { ViewableRobot } from '../discovery/types'
import type { RobotHost } from '../robot-api/types'

export type RobotUpdateType = 'upgrade' | 'downgrade' | 'reinstall'

export type RobotSystemType = 'ot2-balena' | 'ot2-buildroot' | 'flex'

export type RobotUpdateTarget = 'ot2' | 'flex'

export interface RobotUpdateInfo {
  version: string
  target: RobotUpdateTarget
  releaseNotes: string | null
}

export interface RobotUpdateFileInfo {
  systemFile: string
  version: string
}

// stage response from API
// update-server/otupdate/buildroot/update_session.py
export type UpdateSessionStage =
  | 'awaiting-file'
  | 'validating'
  | 'writing'
  | 'done'
  | 'ready-for-restart'
  | 'error'

// client-side update process step to decide what UI to display / API to call next
export type UpdateSessionStep =
  | 'premigration'
  | 'premigrationRestart'
  | 'getToken'
  | 'uploadFile'
  | 'processFile'
  | 'commitUpdate'
  | 'restart'
  | 'restarting'
  | 'finished'

export interface RobotUpdateSession {
  robotName: string
  fileInfo: RobotUpdateFileInfo | null
  token: string | null
  pathPrefix: string | null
  step: UpdateSessionStep | null
  stage: UpdateSessionStage | null
  progress: number | null
  error: string | null
}

export interface PerTargetRobotUpdateState {
  downloadProgress: number | null
  downloadError: string | null
  version: string | null
  releaseNotes: string | null
}

export type RobotUpdateState = Record<
  RobotUpdateTarget,
  PerTargetRobotUpdateState
> & { session: RobotUpdateSession | null }

export interface StartRobotUpdateAction {
  type: 'robotUpdate:START_UPDATE'
  payload: {
    robotName: string
    systemFile: string | null
  }
}

export interface CreateSessionAction {
  type: 'robotUpdate:CREATE_SESSION'
  payload: {
    host: RobotHost
    sessionPath: string
  }
}

export interface CreateSessionSuccessAction {
  type: 'robotUpdate:CREATE_SESSION_SUCCESS'
  payload: {
    host: RobotHost
    token: string
    pathPrefix: string
  }
}

export interface RobotUpdateStatusAction {
  type: 'robotUpdate:STATUS'
  payload: {
    stage: UpdateSessionStage
    message: string
    progress: number | null
  }
}

export interface UnexpectedRobotUpdateError {
  type: 'robotUpdate:UNEXPECTED_ERROR'
  payload: { message: string }
}

export interface RobotUpdateDownloadProgressAction {
  type: 'robotUpdate:DOWNLOAD_PROGRESS'
  payload: {
    progress: number
    target: RobotUpdateTarget
  }
}

export interface RobotUpdateDownloadErrorAction {
  type: 'robotUpdate:DOWNLOAD_ERROR'
  payload: {
    error: string
    target: RobotUpdateTarget
  }
}

export interface RobotUpdateAvailableAction {
  type: 'robotUpdate:UPDATE_VERSION'
  payload: {
    version: string
    target: RobotUpdateTarget
  }
}

export interface RobotUpdateFileInfoAction {
  type: 'robotUpdate:FILE_INFO'
  payload: RobotUpdateFileInfo
}

export type RobotUpdateAction =
  | StartRobotUpdateAction
  | CreateSessionAction
  | CreateSessionSuccessAction
  | RobotUpdateStatusAction
  | UnexpectedRobotUpdateError
  | RobotUpdateDownloadProgressAction
  | RobotUpdateDownloadErrorAction
  | RobotUpdateAvailableAction
  | { type: 'robotUpdate:UPDATE_INFO'; payload: RobotUpdateInfo }
  | RobotUpdateFileInfoAction
  | { type: 'robotUpdate:CHANGELOG_SEEN'; meta: { robotName: string } }
  | { type: 'robotUpdate:UPDATE_IGNORED'; meta: { robotName: string } }
  | {
      type: 'robotUpdate:START_PREMIGRATION'
      payload: RobotHost
      meta: { shell: true }
    }
  | { type: 'robotUpdate:PREMIGRATION_DONE'; payload: string }
  | { type: 'robotUpdate:PREMIGRATION_ERROR'; payload: { message: string } }
  | {
      type: 'robotUpdate:READ_USER_FILE'
      payload: { systemFile: string }
      meta: { shell: true }
    }
  | {
      type: 'robotUpdate:READ_SYSTEM_FILE'
      payload: { target: RobotUpdateTarget }
      meta: { shell: true }
    }
  | {
      type: 'robotUpdate:UPLOAD_FILE'
      payload: { host: ViewableRobot; path: string; systemFile: string }
      meta: { shell: true }
    }
  | { type: 'robotUpdate:FILE_UPLOAD_DONE'; payload: string }
  | { type: 'robotUpdate:SET_SESSION_STEP'; payload: UpdateSessionStep }
  | { type: 'robotUpdate:CLEAR_SESSION' }
  | { type: 'robotUpdate:SET_UPDATE_SEEN'; meta: { robotName: string } }
