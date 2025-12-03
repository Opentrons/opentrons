import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'

import {
  ACTIVE_PROTOCOL_STATUSES,
  CANCELLABLE_STATUSES,
  DISABLED_STATUSES,
  DOOR_OPEN_STATUSES,
  INVALID_ER_RUN_STATUSES,
  NEEDS_CONFIRMATION_STATUSES,
  RECOVERY_STATUSES,
  RUN_AGAIN_STATUSES,
  RUN_NOT_STARTED_STATUSES,
  RUNNING_STATUSES,
  START_RUN_STATUSES,
  TERMINAL_STATUSES,
  VALID_ER_RUN_STATUSES,
} from './constants'

import type { RunStatus } from '@opentrons/api-client'

export function isTerminalRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && TERMINAL_STATUSES.includes(runStatus)
}

export function isStartRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && START_RUN_STATUSES.includes(runStatus)
}

export function isRunAgainStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RUN_AGAIN_STATUSES.includes(runStatus)
}

export function isValidRunAgainStatus(
  runStatus: RunStatus | null,
  isClosingCurrentRun: boolean
): boolean {
  if (runStatus !== null && RUN_AGAIN_STATUSES.includes(runStatus)) {
    // The desktop app uncurrents the run when stopped, and to prevent server-side race conditions, we should wait
    // until the run uncurrenting completes.
    if (runStatus === RUN_STATUS_STOPPED) {
      return !isClosingCurrentRun
    } else {
      return true
    }
  }
  return false
}

export function isRecoveryStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RECOVERY_STATUSES.includes(runStatus)
}

export function isDisabledStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && DISABLED_STATUSES.includes(runStatus)
}

export function isDoorOpenStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && DOOR_OPEN_STATUSES.includes(runStatus)
}

export function isCancellableStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && CANCELLABLE_STATUSES.includes(runStatus)
}

export function isInActiveProtocol(runStatus: RunStatus | null): boolean {
  return runStatus !== null && ACTIVE_PROTOCOL_STATUSES.includes(runStatus)
}

export function isRunningStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RUNNING_STATUSES.includes(runStatus)
}

export function isStopRequestedStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && runStatus === RUN_STATUS_STOP_REQUESTED
}

export function needsConfirmationStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && NEEDS_CONFIRMATION_STATUSES.includes(runStatus)
}

export function isIdleStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && runStatus === RUN_STATUS_IDLE
}

export function isTerminatingOrTerminal(runStatus: RunStatus | null): boolean {
  return (
    runStatus !== null &&
    (isTerminalRunStatus(runStatus) || runStatus === RUN_STATUS_STOP_REQUESTED)
  )
}

export function isStoppingOrStopped(runStatus: RunStatus | null): boolean {
  return (
    runStatus !== null &&
    (runStatus === RUN_STATUS_STOP_REQUESTED ||
      runStatus === RUN_STATUS_STOPPED)
  )
}

export function isValidERRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && VALID_ER_RUN_STATUSES.includes(runStatus)
}

export function isInvalidERRunStatus(runStatus: RunStatus | null): boolean {
  return runStatus !== null && INVALID_ER_RUN_STATUSES.includes(runStatus)
}

export function isRunStatusNotStarted(runStatus: RunStatus | null): boolean {
  return runStatus !== null && RUN_NOT_STARTED_STATUSES.includes(runStatus)
}
