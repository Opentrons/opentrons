import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  getLoadedLabwareDefinitionsByUri,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { useHost } from '@opentrons/react-api-client'

import { getIsOnDevice } from '/app/redux/config'
import { ErrorRecoveryWizard, useERWizard } from './ErrorRecoveryWizard'
import { RecoverySplash, useRecoverySplash } from './RecoverySplash'
import { RecoveryTakeover } from './RecoveryTakeover'
import {
  useCurrentlyRecoveringFrom,
  useERUtils,
  useRecoveryTakeover,
  useRetainedFailedCommandBySource,
} from './hooks'

import type { RunStatus } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { FailedCommand } from './types'

const VALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
]

const INVALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_IDLE,
]

export interface UseErrorRecoveryResult {
  isERActive: boolean
  /* There is no FailedCommand if the run statis is not AWAITING_RECOVERY. */
  failedCommand: FailedCommand | null
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isERActive, setIsERActive] = useState(false)
  // If client accesses a valid ER runs status besides AWAITING_RECOVERY but accesses it outside of Error Recovery flows, don't show ER.
  const [hasSeenAwaitingRecovery, setHasSeenAwaitingRecovery] = useState(false)
  const failedCommand = useCurrentlyRecoveringFrom(runId, runStatus)

  if (
    !hasSeenAwaitingRecovery &&
    ([
      RUN_STATUS_AWAITING_RECOVERY,
      RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
      RUN_STATUS_AWAITING_RECOVERY_PAUSED,
    ] as Array<RunStatus | null>).includes(runStatus)
  ) {
    setHasSeenAwaitingRecovery(true)
  }
  // Reset recovery mode after the client has exited recovery, otherwise "cancel run" will trigger ER after the first recovery.
  else if (
    hasSeenAwaitingRecovery &&
    runStatus != null &&
    INVALID_ER_RUN_STATUSES.includes(runStatus)
  ) {
    setHasSeenAwaitingRecovery(false)
  }

  const isValidRunStatus =
    runStatus != null &&
    VALID_ER_RUN_STATUSES.includes(runStatus) &&
    hasSeenAwaitingRecovery

  if (!isERActive && isValidRunStatus && failedCommand != null) {
    setIsERActive(true)
  }
  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery" or a
  // terminating run status in which we want to persist ER flows. Specific recovery commands cause run status to change.
  // See a specific command's docstring for details.
  // ER handles a null failedCommand outside the splash screen, so we shouldn't set it false here.
  else if (isERActive && !isValidRunStatus) {
    setIsERActive(false)
  }

  return {
    isERActive,
    failedCommand,
  }
}

export interface ErrorRecoveryFlowsProps {
  runId: string
  runStatus: RunStatus | null
  failedCommandByRunRecord: FailedCommand | null
  protocolAnalysis: CompletedProtocolAnalysis | null
}

export function ErrorRecoveryFlows(
  props: ErrorRecoveryFlowsProps
): JSX.Element | null {
  const { protocolAnalysis, runStatus, failedCommandByRunRecord } = props

  const failedCommandBySource = useRetainedFailedCommandBySource(
    failedCommandByRunRecord,
    protocolAnalysis
  )

  const { hasLaunchedRecovery, toggleERWizard, showERWizard } = useERWizard()
  const isOnDevice = useSelector(getIsOnDevice)
  const robotType = protocolAnalysis?.robotType ?? OT2_ROBOT_TYPE
  const robotName = useHost()?.robotName ?? 'robot'

  const isValidRobotSideAnalysis = protocolAnalysis != null

  // TODO(jh, 10-22-24): EXEC-769.
  const labwareDefinitionsByUri = useMemo(
    () =>
      protocolAnalysis != null
        ? getLoadedLabwareDefinitionsByUri(protocolAnalysis?.commands)
        : null,
    [isValidRobotSideAnalysis]
  )
  const allRunDefs =
    labwareDefinitionsByUri != null
      ? Object.values(labwareDefinitionsByUri)
      : []

  const {
    showTakeover,
    isActiveUser,
    intent,
    toggleERWizAsActiveUser,
  } = useRecoveryTakeover(toggleERWizard)

  const recoveryUtils = useERUtils({
    ...props,
    hasLaunchedRecovery,
    toggleERWizAsActiveUser,
    isOnDevice,
    robotType,
    showTakeover,
    failedCommand: failedCommandBySource,
    allRunDefs,
    labwareDefinitionsByUri,
  })

  const renderWizard =
    isActiveUser &&
    (showERWizard || recoveryUtils.doorStatusUtils.isProhibitedDoorOpen)
  const showSplash = useRecoverySplash(isOnDevice, renderWizard as boolean)

  return (
    <>
      {showTakeover ? (
        <RecoveryTakeover
          intent={intent}
          robotName={robotName}
          isOnDevice={isOnDevice}
          runStatus={runStatus}
        />
      ) : null}
      {renderWizard ? (
        <ErrorRecoveryWizard
          {...props}
          {...recoveryUtils}
          robotType={robotType}
          isOnDevice={isOnDevice}
          failedCommand={failedCommandBySource}
          allRunDefs={allRunDefs}
        />
      ) : null}
      {showSplash ? (
        <RecoverySplash
          {...props}
          {...recoveryUtils}
          robotType={robotType}
          robotName={robotName}
          isOnDevice={isOnDevice}
          toggleERWizAsActiveUser={toggleERWizAsActiveUser}
          failedCommand={failedCommandBySource}
          resumePausedRecovery={!renderWizard && !showTakeover}
          allRunDefs={allRunDefs}
        />
      ) : null}
    </>
  )
}
