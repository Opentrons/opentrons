import { CONNECTABLE } from '../discovery'
import {
  RESTART_PENDING_STATUS,
  RESTART_IN_PROGRESS_STATUS,
  RESTART_SUCCEEDED_STATUS,
} from './constants'

import type { ConnectivityStatus } from '../discovery/types'
import type { State } from '../types'
import type {
  PerRobotAdminState,
  ResetConfigOption,
  RobotRestartStatus,
} from './types'

const robotState = (
  state: State,
  name: string
): PerRobotAdminState | null | undefined => state.robotAdmin[name]

export function getRobotRestarting(state: State, robotName: string): boolean {
  const status = robotState(state, robotName)?.restart?.status
  return (
    status === RESTART_PENDING_STATUS || status === RESTART_IN_PROGRESS_STATUS
  )
}

export function getNextRestartStatus(
  state: State,
  robotName: string,
  connectivityStatus: ConnectivityStatus,
  bootId: string | null,
  now: Date
): RobotRestartStatus | null {
  if (getRestartIsComplete(state, robotName, connectivityStatus, bootId)) {
    return RESTART_SUCCEEDED_STATUS
  }

  if (getRestartHasBegun(state, robotName, connectivityStatus)) {
    return RESTART_IN_PROGRESS_STATUS
  }

  return null
}

function getRestartHasBegun(
  state: State,
  robotName: string,
  connectivityStatus: ConnectivityStatus
): boolean {
  const status = robotState(state, robotName)?.restart?.status
  return status === RESTART_PENDING_STATUS && connectivityStatus !== CONNECTABLE
}

function getRestartIsComplete(
  state: State,
  robotName: string,
  connectivityStatus: ConnectivityStatus,
  bootId: string | null
): boolean {
  const prevRestartState = robotState(state, robotName)?.restart

  if (prevRestartState == null || !getRobotRestarting(state, robotName)) {
    return false
  }

  const { status: prevRestartStatus, bootId: prevBootId } = prevRestartState
  const isConnectable = connectivityStatus === CONNECTABLE
  const hasNewBootId = bootId && bootId !== prevBootId
  const wasDown = prevRestartStatus === RESTART_IN_PROGRESS_STATUS

  return isConnectable && (hasNewBootId || wasDown)
}

export function getResetConfigOptions(
  state: State,
  robotName: string
): ResetConfigOption[] {
  return robotState(state, robotName)?.resetConfigOptions || []
}
