import { useProtocolQuery } from '@opentrons/react-api-client'
import { useCurrentRun } from './useCurrentRun'

import type { Protocol } from '@opentrons/api-client'

/**
 * Hook that returns the current protocol based on the current run ID.
 *
 * @returns The protocol object associated with the current run or `null` if there is no current run or the protocol has not been loaded yet.
 */
export function useCurrentProtocol(): Protocol | null {
  const currentProtocolId = useCurrentRun()?.data?.protocolId ?? null

  const { data: protocolRecord } = useProtocolQuery(currentProtocolId, {
    staleTime: Infinity,
  })

  return protocolRecord ?? null
}
