// @flow
import type { State } from '../types'
import { RESTART_PENDING_STATUS, RESTARTING_STATUS } from './constants'
import type { ResetConfigOption, RobotAdminStatus } from './types'

const robotState = (state: State, name: string) => state.robotAdmin[name]

export function getRobotAdminStatus(
  state: State,
  robotName: string
): RobotAdminStatus | null {
  return robotState(state, robotName)?.status || null
}

export function getRobotRestarting(state: State, robotName: string): boolean {
  const status = getRobotAdminStatus(state, robotName)
  return status === RESTART_PENDING_STATUS || status === RESTARTING_STATUS
}

export function getResetConfigOptions(
  state: State,
  robotName: string
): Array<ResetConfigOption> {
  return robotState(state, robotName)?.resetConfigOptions || []
}
