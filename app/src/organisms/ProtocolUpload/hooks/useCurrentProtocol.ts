import type { Protocol } from '@opentrons/api-client'
import { useProtocolQuery } from '@opentrons/react-api-client'

import { useCurrentRun } from './useCurrentRun'

export function useCurrentProtocol(): Protocol | null {
  const currentProtocolId = useCurrentRun()?.data?.protocolId ?? null

  const { data: protocolRecord } = useProtocolQuery(currentProtocolId, {
    staleTime: Infinity,
  })

  return protocolRecord ?? null
}
