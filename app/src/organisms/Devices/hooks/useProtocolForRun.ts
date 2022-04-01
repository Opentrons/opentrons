import * as React from 'react'
import last from 'lodash/last'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import type { Protocol } from '@opentrons/api-client'

export function useProtocolForRun(runId: string | null): Protocol | null {
  const { data: runRecord } = useRunQuery(runId)

  const protocolIdForRun = runRecord?.data?.protocolId ?? null

  const enableProtocolPolling = React.useRef<boolean>(true)
  const { data: protocolRecord } = useProtocolQuery(
    protocolIdForRun,
    { staleTime: Infinity },
    enableProtocolPolling.current
  )

  const mostRecentAnalysis = last(protocolRecord?.data.analyses) ?? null

  React.useEffect(() => {
    if (mostRecentAnalysis?.status === 'completed') {
      enableProtocolPolling.current = false
    } else {
      enableProtocolPolling.current = true
    }
  }, [mostRecentAnalysis?.status])

  return protocolRecord ?? null
}
