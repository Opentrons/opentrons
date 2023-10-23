import last from 'lodash/last'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
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
  const { data: protocolData } = useProtocolQuery(protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
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
