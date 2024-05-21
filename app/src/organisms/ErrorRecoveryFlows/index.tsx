import * as React from 'react'

import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'

import { ErrorRecoveryWizard } from './ErrorRecoveryWizard'
import { useCurrentlyRecoveringFrom } from './utils'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand } from './types'

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
  const failedCommand = useCurrentlyRecoveringFrom(runId, runStatus)

  const toggleER = (): void => {
    setIsERActive(!isERActive)
  }

  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery."
  React.useEffect(() => {
    if (isERActive && runStatus !== RUN_STATUS_AWAITING_RECOVERY) {
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
