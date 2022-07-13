import * as React from 'react'
import last from 'lodash/last'
import { schemaV6Adapter } from '@opentrons/shared-data'
import {
  useProtocolQuery,
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

export interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolAnalysisFile<{}> | null
  protocolKey: string | null
  isProtocolAnalyzing?: boolean
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

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    protocolId,
    {
      staleTime: Infinity,
    },
    isPollingProtocolAnalyses
  )

  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

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
    protocolData:
      mostRecentAnalysis != null ? schemaV6Adapter(mostRecentAnalysis) : null,
    protocolKey: protocolRecord?.data.key ?? null,
    isProtocolAnalyzing:
      mostRecentAnalysis != null && mostRecentAnalysis?.status === 'pending',
  }
}
