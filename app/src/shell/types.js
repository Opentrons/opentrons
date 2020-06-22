// @flow
import type { Observable } from 'rxjs'
import type { Action, Error } from '../types'
import type { LogEntry } from '../logger'
import type { RobotLogsState, RobotLogsAction } from './robot-logs/types'

export type Remote = {|
  dispatch: (action: Action) => void,
  log: (entry: LogEntry) => void,
  inbox: Observable<Action>,
|}

export type WebSocketRemoteDispatchMessage = {|
  channel: 'dispatch',
  payload: Action,
|}

export type WebSocketRemoteLogMessage = {| channel: 'log', payload: LogEntry |}

export type WebSocketRemoteMessage =
  | WebSocketRemoteDispatchMessage
  | WebSocketRemoteLogMessage

export type UpdateInfo = {
  version: string,
  files: Array<{ sha512: string, url: string }>,
  releaseDate: string,
  releaseNotes?: string,
}

export type ShellUpdateState = {|
  checking: boolean,
  downloading: boolean,
  available: boolean,
  downloaded: boolean,
  error: ?Error,
  seen: boolean,
  info: ?UpdateInfo,
|}

export type ShellUpdateAction =
  | {| type: 'shell:CHECK_UPDATE', meta: {| shell: true |} |}
  | {|
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: {| available?: boolean, info?: UpdateInfo, error?: Error |},
    |}
  | {| type: 'shell:DOWNLOAD_UPDATE', meta: {| shell: true |} |}
  | {| type: 'shell:DOWNLOAD_UPDATE_RESULT', payload: {| error?: Error |} |}
  | {| type: 'shell:APPLY_UPDATE', meta: {| shell: true |} |}
  | {| type: 'shell:SET_UPDATE_SEEN' |}

export type ShellState = {|
  update: ShellUpdateState,
  robotLogs: RobotLogsState,
|}

export type UiInitializedAction = {|
  type: 'shell:UI_INITIALIZED',
  meta: {| shell: true |},
|}

export type ShellAction =
  | UiInitializedAction
  | ShellUpdateAction
  | RobotLogsAction
