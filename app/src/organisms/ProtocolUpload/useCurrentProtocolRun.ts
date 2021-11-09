import { useQueryClient, UseMutateFunction } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useProtocolQuery,
  useCreateRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

import type { Protocol, Run } from '@opentrons/api-client'

interface UseCurrentProtocolRun {
  createProtocolRun: UseMutateFunction<Protocol, unknown, File[], unknown>
  protocolRecord?: Protocol | null
  runRecord?: Run | null
}

export function useCurrentProtocolRun(): UseCurrentProtocolRun {
  const host = useHost()
  const queryClient = useQueryClient()
  const currentRunId = useCurrentRunId()

  const { data: runRecord } = useRunQuery(currentRunId)
  const { data: protocolRecord } = useProtocolQuery(
    (runRecord?.data?.createParams?.protocolId as string) ?? null
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
      createRun({
        runType: 'protocol',
        createParams: {
          protocolId: data.data.id,
        },
      })
    },
  })

  return {
    createProtocolRun,
    protocolRecord,
    runRecord,
  }
}
