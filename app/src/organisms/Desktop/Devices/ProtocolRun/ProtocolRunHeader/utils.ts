import {
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { getRobotSerialNumber } from '/app/redux/discovery'

import type { RunStatus } from '@opentrons/api-client'
import type { DiscoveredRobot } from '/app/redux/discovery/types'

const START_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
]
const RUN_AGAIN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
]
const RECOVERY_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
]
const DISABLED_STATUSES: RunStatus[] = [
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  ...RECOVERY_STATUSES,
]
const CANCELLABLE_STATUSES: RunStatus[] = [
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
]
const TERMINAL_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_FAILED,
]

export function isTerminalRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && TERMINAL_STATUSES.includes(runStatus)
}

export function isStartRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && START_RUN_STATUSES.includes(runStatus)
}

export function isRunAgainStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RUN_AGAIN_STATUSES.includes(runStatus)
}

export function isRecoveryStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RECOVERY_STATUSES.includes(runStatus)
}

export function isDisabledStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && DISABLED_STATUSES.includes(runStatus)
}

export function isCancellableStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && CANCELLABLE_STATUSES.includes(runStatus)
}

export function getFallbackRobotSerialNumber(
  robot: DiscoveredRobot | null
): string {
  const sn = robot?.status != null ? getRobotSerialNumber(robot) : null
  return sn ?? ''
}
