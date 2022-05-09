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
}

export function useProtocolDetailsForRun(
  runId: string | null
): ProtocolDetails {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const [isPollingProtocol, setIsPollingProtocol] = React.useState<boolean>(
    true
  )

  const { data: protocolRecord } = useProtocolQuery(
    protocolId,
    {
      staleTime: Infinity,
    },
    isPollingProtocol
  )

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })

  const mostRecentAnalysisSummary =
    last(protocolRecord?.data?.analysisSummaries ?? []) ?? null

  React.useEffect(() => {
    if (mostRecentAnalysisSummary?.status === 'completed') {
      setIsPollingProtocol(false)
    } else {
      setIsPollingProtocol(true)
    }
  }, [mostRecentAnalysisSummary?.status])

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  return {
    displayName: displayName ?? null,
    protocolData:
      mostRecentAnalysis != null ? schemaV6Adapter(mostRecentAnalysis) : null,
  }
}
