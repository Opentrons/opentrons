// @flow
import type { RobotHost } from '../../robot-api'

export type BuildrootUpdateInfo = {|
  version: string,
  releaseNotes: string,
|}

export type BuildrootStatus = 'balena' | 'migrating' | 'buildroot'

// update-server/otupdate/buildroot/update_session.py
export type UpdateSessionStage =
  | 'awaiting-file'
  | 'validating'
  | 'writing'
  | 'done'
  | 'ready-for-restart'
  | 'error'

export type BuildrootUpdateSession = {|
  robotName: string,
  triggerUpdate: boolean,
  token: string | null,
  pathPrefix: string | null,
|}

export type BuildrootState = {|
  seen: boolean,
  downloadProgress: number | null,
  downloadError: string | null,
  info: BuildrootUpdateInfo | null,
  session: BuildrootUpdateSession | null,
|}

export type StartBuildrootUpdateAction = {|
  type: 'buildroot:START_UPDATE',
  payload: string,
|}

// TODO(mc, 2019-07-19): flesh this action type out so it's actually useful
export type UnexpectedBuildrootError = {|
  type: 'buildroot:UNEXPECTED_ERROR',
|}

export type BuildrootAction =
  | {| type: 'buildroot:DOWNLOAD_PROGRESS', payload: number |}
  | {| type: 'buildroot:DOWNLOAD_ERROR', payload: string |}
  | {| type: 'buildroot:UPDATE_INFO', payload: BuildrootUpdateInfo | null |}
  | {| type: 'buildroot:SET_UPDATE_SEEN' |}
  | {|
      type: 'buildroot:START_PREMIGRATION',
      payload: RobotHost,
      meta: {| shell: true |},
    |}
  | {| type: 'buildroot:PREMIGRATION_STARTED' |}
  | {| type: 'buildroot:PREMIGRATION_DONE', payload: string |}
  | {| type: 'buildroot:PREMIGRATION_ERROR', payload: string |}
  | StartBuildrootUpdateAction
  | UnexpectedBuildrootError
