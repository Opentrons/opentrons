import { useSelector } from 'react-redux'

import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import type { State } from '/app/redux/types'

export interface ProtocolRunSetupLoadingState {
  isSetupLoading: boolean
}

/**
 * Setup tab loading gate:
 * - run record / protocol analysis missing
 * - Redux LPC store not initialized yet for this run
 */
export function useProtocolRunSetupLoadingState(
  runId: string,
  robotName: string,
  isRunRecordLoading: boolean
): ProtocolRunSetupLoadingState {
  const isFlex = useIsFlex(robotName)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis

  const hasLpcState = useSelector(
    (state: State) => state.protocolRuns?.[runId]?.lpc != null
  )

  return {
    isSetupLoading:
      isRunRecordLoading ||
      protocolAnalysis == null ||
      (isFlex && !hasLpcState),
  }
}
