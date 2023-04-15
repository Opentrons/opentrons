import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

/**
 * Returns the most recent completed analysis for a given run ID.
 *
 * @param {string|null} runId - The ID of the run for which to get the most recent completed analysis.
 *
 * @returns {CompletedProtocolAnalysis|null} The most recent completed analysis, or null if none is found.
 */
export function useMostRecentCompletedAnalysis(
  runId: string | null
): CompletedProtocolAnalysis | null {
  const { data: runRecord } = useRunQuery(runId)
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId)

  return (
    (protocolAnalyses?.data ?? [])
      .reverse()
      .find(
        (analysis): analysis is CompletedProtocolAnalysis =>
          analysis.status === 'completed'
      ) ?? null
  )
}
