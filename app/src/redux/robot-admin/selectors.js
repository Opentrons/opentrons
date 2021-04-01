// @flow
import { add, isWithinInterval } from 'date-fns'
import { CONNECTABLE } from '../discovery'
import {
  RESTART_TIMEOUT_SEC,
  RESTART_PENDING_STATUS,
  RESTARTING_STATUS,
  RESTART_SUCCEEDED_STATUS,
  RESTART_TIMED_OUT_STATUS,
} from './constants'

import type { ConnectivityStatus } from '../discovery/types'
import type { State } from '../types'
import type { ResetConfigOption, RobotRestartStatus } from './types'

const robotState = (state: State, name: string) => state.robotAdmin[name]

export function getRobotRestarting(state: State, robotName: string): boolean {
  const status = robotState(state, robotName)?.restart?.status
  return status === RESTART_PENDING_STATUS || status === RESTARTING_STATUS
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
    return RESTARTING_STATUS
  }

  if (getRestartHasTimedOut(state, robotName, now)) {
    return RESTART_TIMED_OUT_STATUS
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

function getRestartHasTimedOut(
  state: State,
  robotName: string,
  now: Date
): boolean {
  const restartState = robotState(state, robotName)?.restart

  if (!restartState?.startTime || !getRobotRestarting(state, robotName)) {
    return false
  }

  const { startTime } = restartState
  const endTime = add(startTime, { seconds: RESTART_TIMEOUT_SEC })

  return !isWithinInterval(now, { start: startTime, end: endTime })
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
  const wasDown = prevRestartStatus === RESTARTING_STATUS

  return isConnectable && (hasNewBootId || wasDown)
}

export function getResetConfigOptions(
  state: State,
  robotName: string
): Array<ResetConfigOption> {
  return robotState(state, robotName)?.resetConfigOptions || []
}
