import { useEffect } from 'react'

import { isTerminatingOrTerminal } from '/app/local-resources/runs/utils'
import { useIsRunCurrent } from '/app/resources/runs'

import type { RunStatus } from '@opentrons/api-client'

export interface UseCloseTerminalRunParams {
  runId: string
  runStatus: RunStatus | null
  closeCurrentRun: () => void
}

// Dismiss the protocol run as soon as it is terminating or terminal.
export function useCloseTerminalRun({
  runId,
  runStatus,
  closeCurrentRun,
}: UseCloseTerminalRunParams): void {
  const isRunCurrent = useIsRunCurrent(runId)

  useEffect(() => {
    if (isTerminatingOrTerminal(runStatus) && isRunCurrent) {
      closeCurrentRun()
    }
  }, [runStatus, isRunCurrent, closeCurrentRun])
}
