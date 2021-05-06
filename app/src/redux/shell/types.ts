import type { Error } from '../types'
import type { RobotLogsState, RobotLogsAction } from './robot-logs/types'

export interface Remote {
  ipcRenderer: { send: (s: string, ...args: unknown[]) => void }
}

interface File {
  sha512: string
  url: string
  [key: string]: unknown
}
export interface UpdateInfo {
  version: string
  files: File[]
  releaseDate: string
  releaseNotes?: string
}

export interface ShellUpdateState {
  checking: boolean
  downloading: boolean
  available: boolean
  downloaded: boolean
  error: Error | null | undefined
  info: UpdateInfo | null | undefined
}

export type ShellUpdateAction =
  | { type: 'shell:CHECK_UPDATE'; meta: { shell: true } }
  | {
      type: 'shell:CHECK_UPDATE_RESULT'
      payload: { available?: boolean; info?: UpdateInfo; error?: Error }
    }
  | { type: 'shell:DOWNLOAD_UPDATE'; meta: { shell: true } }
  | { type: 'shell:DOWNLOAD_UPDATE_RESULT'; payload: { error?: Error } }
  | { type: 'shell:APPLY_UPDATE'; meta: { shell: true } }

export interface ShellState {
  update: ShellUpdateState
  robotLogs: RobotLogsState
}

export interface UiInitializedAction {
  type: 'shell:UI_INITIALIZED'
  meta: { shell: true }
}

export type ShellAction =
  | UiInitializedAction
  | ShellUpdateAction
  | RobotLogsAction
