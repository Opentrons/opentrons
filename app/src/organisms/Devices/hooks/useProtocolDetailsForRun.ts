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
  const { data: runRecord } = useRunQuery(runId)
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const enableProtocolPolling = React.useRef<boolean>(true)

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    protocolId,
    { staleTime: Infinity },
    enableProtocolPolling.current
  )

  const mostRecentAnalysis = last(protocolAnalyses) ?? null

  React.useEffect(() => {
    if (mostRecentAnalysis?.status === 'completed') {
      enableProtocolPolling.current = false
    } else {
      enableProtocolPolling.current = true
    }
  }, [mostRecentAnalysis?.status])

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return {
    displayName: displayName ?? null,
    protocolData:
      mostRecentAnalysis != null ? schemaV6Adapter(mostRecentAnalysis) : null,
  }
}
