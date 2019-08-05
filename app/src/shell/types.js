// @flow
import type { ApiUpdateInfo as ApiUpdateState } from './api-update'
import type { BuildrootState, BuildrootAction } from './buildroot/types'
import type { ShellUpdateState, ShellUpdateAction } from './update'

export type ShellState = {|
  update: ShellUpdateState,
  apiUpdate: ApiUpdateState,
  buildroot: BuildrootState,
|}

export type ShellLogsDownloadAction = {|
  type: 'shell:DOWNLOAD_LOGS',
  payload: {| logUrls: Array<string> |},
  meta: {| shell: true |},
|}

export type ShellAction =
  | ShellUpdateAction
  | ShellLogsDownloadAction
  | BuildrootAction
