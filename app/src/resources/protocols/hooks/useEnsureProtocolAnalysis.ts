import { useEffect, useRef, useState } from 'react'
import last from 'lodash/last'

import {
  useCreateProtocolAnalysisMutation,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import type { AxiosError } from 'axios'
import type { ErrorResponse, Protocol } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisSummary,
} from '@opentrons/shared-data'

const ANALYSIS_POLL_MS = 5000
const LAST_ANALYSIS_PENDING = 'LastAnalysisPending'

export interface EnsureProtocolAnalysisResult {
  analysis: CompletedProtocolAnalysis | null
  analysisId: string | null
  isAnalyzing: boolean
  protocolRecord: Protocol | undefined
}

/**
 * Poll protocol summaries until analysis is completed. If the protocol has no
 * analysis summaries, start one with POST /protocols/:id/analyses.
 */
export function useEnsureProtocolAnalysis(
  protocolId: string | null
): EnsureProtocolAnalysisResult {
  const hasRequestedAnalysis = useRef(false)
  const [shouldPollProtocol, setShouldPollProtocol] = useState(true)
  const { createProtocolAnalysis } =
    useCreateProtocolAnalysisMutation(protocolId)

  const { data: protocolRecord } = useProtocolQuery(
    protocolId,
    { staleTime: Infinity },
    protocolId != null && shouldPollProtocol ? true : undefined
  )
  const analysisSummaries: ProtocolAnalysisSummary[] =
    protocolRecord?.data.analysisSummaries ?? []
  const latestSummary = last(analysisSummaries)
  const analysisId = latestSummary?.id ?? null

  const { data: analysis = null } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    analysisId,
    {
      enabled: protocolId != null && analysisId != null,
      refetchInterval:
        latestSummary?.status === 'completed' ? false : ANALYSIS_POLL_MS,
    }
  )

  useEffect(() => {
    hasRequestedAnalysis.current = false
  }, [protocolId])

  useEffect(() => {
    setShouldPollProtocol(latestSummary?.status !== 'completed')
  }, [latestSummary?.status])

  useEffect(() => {
    if (
      protocolId == null ||
      protocolRecord == null ||
      analysisSummaries.length > 0 ||
      hasRequestedAnalysis.current
    ) {
      return
    }
    hasRequestedAnalysis.current = true
    createProtocolAnalysis(
      { protocolKey: protocolId, forceReAnalyze: false },
      {
        onError: (error: AxiosError<ErrorResponse>) => {
          // 503 LastAnalysisPending means analysis is already in progress.
          if (isLastAnalysisPendingError(error)) {
            hasRequestedAnalysis.current = true
          }
        },
      }
    )
  }, [
    analysisSummaries.length,
    createProtocolAnalysis,
    protocolId,
    protocolRecord,
  ])

  return {
    analysis,
    analysisId,
    isAnalyzing: analysis?.status !== 'completed',
    protocolRecord,
  }
}

function isLastAnalysisPendingError(error: unknown): boolean {
  if (
    typeof error !== 'object' ||
    error == null ||
    !('isAxiosError' in error) ||
    error.isAxiosError !== true
  ) {
    return false
  }
  const axiosError = error as AxiosError<ErrorResponse>
  return (
    axiosError.response?.status === 503 &&
    axiosError.response.data?.errors?.[0]?.id === LAST_ANALYSIS_PENDING
  )
}
