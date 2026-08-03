import { useQuery } from 'react-query'

import { getProtocolAnalysisAsDocument } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function useProtocolAnalysisAsDocumentQuery(
  protocolId: string | null,
  analysisId: string | null,
  options?: UseQueryOptions<CompletedProtocolAnalysis>
): UseQueryResult<CompletedProtocolAnalysis | null> {
  const host = useHost()
  const query = useQuery<CompletedProtocolAnalysis>(
    getQueryKey(host, 'protocols', protocolId, 'analyses', analysisId),
    () =>
      getProtocolAnalysisAsDocument(host!, protocolId!, analysisId!).then(
        response => response.data
      ),
    options
  )

  return query
}
