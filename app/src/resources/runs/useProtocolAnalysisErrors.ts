import last from 'lodash/last'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { useNotifyRunQuery } from './useNotifyRunQuery'

import type { AnalysisError } from '@opentrons/shared-data'

export interface ProtocolAnalysisErrors {
  analysisErrors: AnalysisError[] | null
}

export function useProtocolAnalysisErrors(
  runId: string | null
): ProtocolAnalysisErrors {
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolData } = useProtocolQuery(protocolId)
  const analysisId = last(protocolData?.data.analysisSummaries)?.id ?? null
  const { data: mostRecentAnalysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    analysisId,
    { enabled: protocolData != null && analysisId != null }
  )

  if (protocolId === null || runRecord?.data?.current === false) {
    return { analysisErrors: null }
  }

  if (mostRecentAnalysis?.status !== 'completed') {
    return { analysisErrors: null }
  }

  return {
    analysisErrors: mostRecentAnalysis?.errors ?? null,
  }
}
