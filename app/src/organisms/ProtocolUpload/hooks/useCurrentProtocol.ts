import * as React from 'react'
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

  return protocolRecord ?? null
}
