import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { useFeatureFlag } from '../../redux/config'
import { ErrorRecoveryWizard } from './ErrorRecoveryWizard'
import { RunPausedSplash } from './RunPausedSplash'
import { useCurrentlyFailedRunCommand } from './utils'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand } from './types'

const VALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
]

interface UseErrorRecoveryResult {
  isERActive: boolean
  failedCommand: FailedCommand | null
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isERActive, setIsERActive] = React.useState(false)
  const failedCommand = useCurrentlyFailedRunCommand(runId, runStatus)

  const isValidRunStatus =
    runStatus != null && VALID_ER_RUN_STATUSES.includes(runStatus)

  if (!isERActive && isValidRunStatus) {
    setIsERActive(true)
  }
  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery" or a
  // terminating run status in which we want to persist ER flows. Specific recovery commands cause run status to change.
  // See a specific command's docstring for details.
  else if (isERActive && !isValidRunStatus) {
    setIsERActive(false)
  }

  return {
    isERActive,
    failedCommand,
  }
}

interface ErrorRecoveryFlowsProps {
  runId: string
  failedCommand: FailedCommand | null
}

export function ErrorRecoveryFlows({
  runId,
  failedCommand,
}: ErrorRecoveryFlowsProps): JSX.Element | null {
  const [showERWizard, setShowERWizard] = React.useState(false)
  const enableRunNotes = useFeatureFlag('enableRunNotes')

  const toggleER = (): void => {
    setShowERWizard(!showERWizard)
  }

  if (!enableRunNotes) {
    return null
  }

  return (
    <>
      {showERWizard ? (
        <ErrorRecoveryWizard runId={runId} failedCommand={failedCommand} />
      ) : null}
      <RunPausedSplash onClick={toggleER} failedCommand={failedCommand} />
    </>
  )
}
