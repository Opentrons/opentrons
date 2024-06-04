import { useQuery } from 'react-query'
import { getProtocolAnalysisAsDocument } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisSummary,
} from '@opentrons/shared-data'

const getMostRecentSuccessfulAnalysisId = async (
  analysisSummaryIds: string[],
  host: HostConfig | null,
  protocolId: string
): Promise<CompletedProtocolAnalysis | null> => {
  for (const analysisId of analysisSummaryIds) {
    const { data: analysis } = await getProtocolAnalysisAsDocument(
      host as HostConfig,
      protocolId,
      analysisId
    )
    if (analysis.errors.length === 0) {
      return analysis
    }
  }
  return null
}

export function useMostRecentSuccessfulAnalysisAsDocumentQuery<TError = Error>(
  protocolId: string,
  analysisSummaries: ProtocolAnalysisSummary[],
  options: UseQueryOptions<CompletedProtocolAnalysis | null, TError> = {}
): UseQueryResult<CompletedProtocolAnalysis | null, TError> {
  const host = useHost()

  const query = useQuery<CompletedProtocolAnalysis | null, TError>(
    [host, 'protocols', protocolId, 'analyses', 'mostRecentSuccessful'],
    async () => {
      const analysisIds = analysisSummaries.map(summary => summary.id)

      const mostRecentSuccessfulAnalysis = await getMostRecentSuccessfulAnalysisId(
        analysisIds,
        host,
        protocolId
      )

      return mostRecentSuccessfulAnalysis
    },
    options
  )

  return query
}
