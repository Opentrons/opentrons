import last from 'lodash/last'
import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'
import {
  CompletedProtocolAnalysis,
  PendingProtocolAnalysis,
} from '@opentrons/shared-data'

export function useMostRecentCompletedAnalysis(
  runId: string | null
): CompletedProtocolAnalysis | null {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })

  return (
    (protocolAnalyses?.data ?? [])
      .reverse()
      .find(
        (analysis): analysis is CompletedProtocolAnalysis =>
          analysis.status === 'completed'
      ) ?? null
  )
}
