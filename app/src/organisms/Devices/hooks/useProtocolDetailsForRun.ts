import * as React from 'react'
import last from 'lodash/last'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  useProtocolQuery,
  useRunQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'

import type {
  RobotType,
  CompletedProtocolAnalysis,
  PendingProtocolAnalysis,
} from '@opentrons/shared-data'

const ANALYSIS_POLL_MS = 5000
export interface ProtocolDetails {
  displayName: string | null
  protocolData: CompletedProtocolAnalysis | PendingProtocolAnalysis | null
  protocolKey: string | null
  isProtocolAnalyzing?: boolean
  robotType: RobotType
}

export function useProtocolDetailsForRun(
  runId: string | null
): ProtocolDetails {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const [
    isPollingProtocolAnalyses,
    setIsPollingProtocolAnalyses,
  ] = React.useState<boolean>(true)

  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const { data: mostRecentAnalysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolRecord?.data.analysisSummaries)?.id ?? null,
    {
      enabled: protocolRecord != null && isPollingProtocolAnalyses,
      refetchInterval: ANALYSIS_POLL_MS,
    }
  )

  React.useEffect(() => {
    if (mostRecentAnalysis?.status === 'completed') {
      setIsPollingProtocolAnalyses(false)
    } else {
      setIsPollingProtocolAnalyses(true)
    }
  }, [mostRecentAnalysis?.status])

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return {
    displayName: displayName ?? null,
    protocolData: mostRecentAnalysis ?? null,
    protocolKey: protocolRecord?.data.key ?? null,
    isProtocolAnalyzing: protocolRecord != null && mostRecentAnalysis == null,
    robotType:
      protocolRecord?.data.robotType ??
      (mostRecentAnalysis?.status === 'completed'
        ? mostRecentAnalysis?.robotType ?? FLEX_ROBOT_TYPE
        : FLEX_ROBOT_TYPE),
  }
}
