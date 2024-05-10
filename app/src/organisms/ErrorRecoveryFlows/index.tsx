import * as React from 'react'

import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'

import { ErrorRecoveryWizard } from './ErrorRecoveryWizard'
import { useCurrentlyFailedRunCommand } from './utils'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand } from './types'

interface UseErrorRecoveryResult {
  isEREnabled: boolean
  failedCommand: FailedCommand | null
  toggleER: () => void
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isEREnabled, setIsEREnabled] = React.useState(false)
  const failedCommand = useCurrentlyFailedRunCommand(runId, runStatus)

  const toggleER = (): void => {
    setIsEREnabled(!isEREnabled)
  }

  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery."
  React.useEffect(() => {
    if (isEREnabled && runStatus !== RUN_STATUS_AWAITING_RECOVERY) {
      setIsEREnabled(false)
    }
  }, [isEREnabled, runStatus])

  return {
    isEREnabled,
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
