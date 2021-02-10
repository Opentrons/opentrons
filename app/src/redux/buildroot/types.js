// @flow
import type { RobotHost } from '../robot-api/types'

export type BuildrootUpdateType = 'upgrade' | 'downgrade' | 'reinstall'

export type RobotSystemType = 'balena' | 'buildroot'

export type BuildrootUpdateInfo = {|
  releaseNotes: string,
|}

export type BuildrootUserFileInfo = {|
  systemFile: string,
  version: string,
|}

export type BuildrootStatus = 'balena' | 'migrating' | 'buildroot'

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

export type BuildrootUpdateSession = {|
  robotName: string,
  userFileInfo: BuildrootUserFileInfo | null,
  token: string | null,
  pathPrefix: string | null,
  step: UpdateSessionStep | null,
  stage: UpdateSessionStage | null,
  progress: number | null,
  error: string | null,
|}

export type BuildrootState = {|
  seen: boolean,
  downloadProgress: number | null,
  downloadError: string | null,
  version: string | null,
  info: BuildrootUpdateInfo | null,
  session: BuildrootUpdateSession | null,
|}

export type StartBuildrootUpdateAction = {|
  type: 'buildroot:START_UPDATE',
  payload: {| robotName: string, systemFile: string | null |},
|}

export type CreateSessionAction = {|
  type: 'buildroot:CREATE_SESSION',
  payload: {| host: RobotHost, sessionPath: string |},
|}

export type CreateSessionSuccessAction = {|
  type: 'buildroot:CREATE_SESSION_SUCCESS',
  payload: {| host: RobotHost, token: string, pathPrefix: string |},
|}

export type BuildrootStatusAction = {|
  type: 'buildroot:STATUS',
  payload: {|
    stage: UpdateSessionStage,
    message: string,
    progress: number | null,
  |},
|}

export type UnexpectedBuildrootError = {|
  type: 'buildroot:UNEXPECTED_ERROR',
  payload: {| message: string |},
|}

export type BuildrootAction =
  | StartBuildrootUpdateAction
  | CreateSessionAction
  | CreateSessionSuccessAction
  | BuildrootStatusAction
  | UnexpectedBuildrootError
  | {| type: 'buildroot:DOWNLOAD_PROGRESS', payload: number |}
  | {| type: 'buildroot:DOWNLOAD_ERROR', payload: string |}
  | {| type: 'buildroot:UPDATE_VERSION', payload: string |}
  | {| type: 'buildroot:UPDATE_INFO', payload: BuildrootUpdateInfo |}
  | {| type: 'buildroot:USER_FILE_INFO', payload: BuildrootUserFileInfo |}
  | {| type: 'buildroot:SET_UPDATE_SEEN', meta: {| robotName: string |} |}
  | {| type: 'buildroot:CHANGELOG_SEEN', meta: {| robotName: string |} |}
  | {| type: 'buildroot:UPDATE_IGNORED', meta: {| robotName: string |} |}
  | {|
      type: 'buildroot:START_PREMIGRATION',
      payload: RobotHost,
      meta: {| shell: true |},
    |}
  | {| type: 'buildroot:PREMIGRATION_DONE', payload: string |}
  | {| type: 'buildroot:PREMIGRATION_ERROR', payload: {| message: string |} |}
  | {|
      type: 'buildroot:READ_USER_FILE',
      payload: {| systemFile: string |},
      meta: {| shell: true |},
    |}
  | {|
      type: 'buildroot:UPLOAD_FILE',
      payload: {| host: RobotHost, path: string, systemFile: string | null |},
      meta: {| shell: true |},
    |}
  | {| type: 'buildroot:FILE_UPLOAD_DONE', payload: string |}
  | {| type: 'buildroot:SET_SESSION_STEP', payload: UpdateSessionStep |}
  | {| type: 'buildroot:CLEAR_SESSION' |}
