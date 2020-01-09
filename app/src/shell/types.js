// @flow
import type { Service } from '@opentrons/discovery-client'
import type { Error } from '../types'
import type { Config } from '../config/types'
import type { RobotLogsState, RobotLogsAction } from './robot-logs/types'

export type Remote = {|
  ipcRenderer: {| send: (string, ...args: Array<mixed>) => void |},
  CURRENT_VERSION: string,
  CURRENT_RELEASE_NOTES: string,
  INITIAL_CONFIG: Config,
  INITIAL_ROBOTS: Array<Service>,
|}

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

export type ShellAction = ShellUpdateAction | RobotLogsAction
