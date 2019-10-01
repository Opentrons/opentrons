// @flow
import type { Service } from '@opentrons/discovery-client'
import type { Config } from '../config/types'
import type { BuildrootState, BuildrootAction } from './buildroot/types'
import type { RobotLogsState, RobotLogsAction } from './robot-logs/types'
import type { ShellUpdateState, ShellUpdateAction } from './update'

export type Remote = {|
  ipcRenderer: {| send: (string, ...args: Array<mixed>) => void |},
  CURRENT_VERSION: string,
  CURRENT_RELEASE_NOTES: string,
  INITIAL_CONFIG: Config,
  INITIAL_ROBOTS: Array<Service>,
|}

export type ShellState = {|
  update: ShellUpdateState,
  buildroot: BuildrootState,
  robotLogs: RobotLogsState,
|}

export type ShellAction = ShellUpdateAction | BuildrootAction | RobotLogsAction
