import { useState, useEffect } from 'react'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'

// TODO(jh, 08-06-24): Revisit this. Can the server reasonably supply the failed command via useCurrentlyRecoveringFrom
// during all states the app cares about?

export interface FailedCommandBySource {
  byAnalysis: RunTimeCommand
  byRunRecord: RunTimeCommand
}

/**
 * Currently, Error Recovery needs the failedCommand from the run record and the failedCommand from protocol analysis.
 * In order to reduce misuse, bundle the failedCommand into "run" and "analysis" versions.
 */
export function useRetainedFailedCommandBySource(
  failedCommandByRunRecord: ErrorRecoveryFlowsProps['failedCommandByRunRecord'],
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
): FailedCommandBySource | null {
  // In some cases, Error Recovery (by the app definition) persists when Error Recovery (by the server definition) does
  // not persist. Retaining the failed command allows the app to show information related to the failed command while
  // the robot is out of "awaiting-recovery" (by the server definition).
  const [
    retainedFailedCommand,
    setRetainedFailedCommand,
  ] = useState<FailedCommandBySource | null>(null)

  useEffect(() => {
    if (failedCommandByRunRecord !== null) {
      const failedCommandByAnalysis =
        protocolAnalysis?.commands.find(
          command => command.key === failedCommandByRunRecord?.key
        ) ?? null

      if (failedCommandByAnalysis != null) {
        setRetainedFailedCommand({
          byRunRecord: failedCommandByRunRecord,
          byAnalysis: failedCommandByAnalysis,
        })
      }
    }
  }, [
    failedCommandByRunRecord?.key,
    failedCommandByRunRecord?.error?.errorType,
    protocolAnalysis?.id,
  ])

  return retainedFailedCommand
}
