import { useQuery } from 'react-query'
import { getProtocolAnalysisAsDocument } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig } from '@opentrons/api-client'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function useProtocolAnalysisAsDocumentQuery(
  protocolId: string | null,
  analysisId: string | null,
  options?: UseQueryOptions<CompletedProtocolAnalysis>
): UseQueryResult<CompletedProtocolAnalysis | null> {
  const host = useHost()
  const query = useQuery<CompletedProtocolAnalysis>(
    [host, 'protocols', protocolId, 'analyses', analysisId],
    () =>
      getProtocolAnalysisAsDocument(
        host as HostConfig,
        protocolId as string,
        analysisId as string
      ).then(response => response.data),
    options
  )

  return query
}
