import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

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
