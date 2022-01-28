import * as React from 'react'
import last from 'lodash/last'
import { useProtocolQuery } from '@opentrons/react-api-client'
import { useCurrentRun } from './useCurrentRun'

import type { Protocol } from '@opentrons/api-client'

export function useCurrentProtocol(): Protocol | null {
  const currentRun = useCurrentRun()
  if (currentRun == null) return null

  const enableProtocolPolling = React.useRef<boolean>(
    currentRun.data.protocolId != null
  )
  const { data: protocolRecord } = useProtocolQuery(
    (currentRun.data?.protocolId as string) ?? null,
    { staleTime: Infinity },
    enableProtocolPolling.current
  )

  const mostRecentAnalysis = last(protocolRecord?.data.analyses) ?? null

  React.useEffect(() => {
    if (
      mostRecentAnalysis?.status === 'completed' &&
      enableProtocolPolling.current
    ) {
      enableProtocolPolling.current = false
    } else if (
      currentRun.data.protocolId != null &&
      !enableProtocolPolling.current &&
      mostRecentAnalysis?.status !== 'completed'
    ) {
      enableProtocolPolling.current = true
    }
  }, [mostRecentAnalysis?.status, currentRun.data.protocolId])

  return protocolRecord ?? null
}
