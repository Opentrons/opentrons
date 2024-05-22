import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { ErrorRecoveryWizard } from './ErrorRecoveryWizard'
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
  toggleER: () => void
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isERActive, setIsERActive] = React.useState(false)
  const failedCommand = useCurrentlyFailedRunCommand(runId, runStatus)

  const toggleER = (): void => {
    setIsERActive(!isERActive)
  }

  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery" or a
  // terminating run status in which we want to persist ER flows.
  React.useEffect(() => {
    const isValidRunStatus =
      runStatus != null && VALID_ER_RUN_STATUSES.includes(runStatus)

    if (isERActive && !isValidRunStatus) {
      setIsERActive(false)
    }
  }, [isERActive, runStatus])

  return {
    isERActive,
    failedCommand,
    toggleER,
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
  return <ErrorRecoveryWizard runId={runId} failedCommand={failedCommand} />
}
