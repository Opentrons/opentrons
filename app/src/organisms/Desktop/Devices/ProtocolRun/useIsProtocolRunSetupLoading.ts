import { useSelector } from 'react-redux'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { useRunRecordLabwareOffsets } from './SetupLabwarePositionCheck/FlexSetupLPC/useRunRecordLabwareOffsets'

import type { State } from '/app/redux/types'

/**
 * Setup tab loading gate:
 * - run record still on fetch
 * - protocol analysis missing
 * - Flex: wait for LPC Redux OR settled run-record offsets.
 */
export function useIsProtocolRunSetupLoading(
  runId: string,
  isRunRecordLoading: boolean,
  isFlex: boolean,
  runHasStarted: boolean
): boolean {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const hasLpcState = useSelector(
    (state: State) => state.protocolRuns?.[runId]?.lpc != null
  )
  const { isReady: isRunRecordOffsetsReady } = useRunRecordLabwareOffsets(runId)

  return (
    isRunRecordLoading ||
    protocolAnalysis == null ||
    (isFlex && !runHasStarted && !hasLpcState && !isRunRecordOffsetsReady)
  )
}
