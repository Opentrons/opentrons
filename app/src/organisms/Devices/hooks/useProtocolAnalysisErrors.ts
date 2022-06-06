import last from 'lodash/last'
import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { AnalysisError } from '@opentrons/shared-data'

export interface ProtocolAnalysisErrors {
  analysisErrors: AnalysisError[] | null
}

export function useProtocolAnalysisErrors(
  runId: string | null
): ProtocolAnalysisErrors {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })

  if (protocolId === null || runRecord?.data?.current === false) {
    return { analysisErrors: null }
  }

  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  if (mostRecentAnalysis?.status !== 'completed') {
    return { analysisErrors: null }
  }

  return {
    analysisErrors: mostRecentAnalysis?.errors ?? null,
  }
}
