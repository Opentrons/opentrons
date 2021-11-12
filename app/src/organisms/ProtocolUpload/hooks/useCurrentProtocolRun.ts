import { useQueryClient } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useProtocolQuery,
  useCreateRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

import type { UseMutateFunction } from 'react-query'
import type { Protocol, Run } from '@opentrons/api-client'

const REFETCH_INTERVAL = 1000

export interface UseCurrentProtocolRun {
  createProtocolRun: UseMutateFunction<Protocol, unknown, File[], unknown>
  protocolRecord?: Protocol | null
  runRecord?: Run | null
}

export function useCurrentProtocolRun(): UseCurrentProtocolRun {
  const host = useHost()
  const queryClient = useQueryClient()
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })
  const { data: protocolRecord } = useProtocolQuery(
    (runRecord?.data?.protocolId as string) ?? null
  )

  const { createRun } = useCreateRunMutation({
    onSuccess: () => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
    },
  })
  const { createProtocol: createProtocolRun } = useCreateProtocolMutation({
    onSuccess: data => {
      createRun({ protocolId: data.data.id })
    },
  })

  return {
    createProtocolRun,
    protocolRecord,
    runRecord,
  }
}
