import * as React from 'react'
import last from 'lodash/last'
import { useProtocolQuery } from '@opentrons/react-api-client'
import { useCurrentRun } from './useCurrentRun'

import type { Protocol } from '@opentrons/api-client'

export function useCurrentProtocol(): Protocol | null {
  const currentProtocolId = useCurrentRun()?.data?.protocolId ?? null

  const enableProtocolPolling = React.useRef<boolean>(true)
  const { data: protocolRecord } = useProtocolQuery(
    currentProtocolId,
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
