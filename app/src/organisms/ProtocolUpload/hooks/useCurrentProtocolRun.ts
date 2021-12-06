import * as React from 'react'
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
  isCreatingProtocolRun?: boolean
}

export function useCurrentProtocolRun(): UseCurrentProtocolRun {
  const host = useHost()
  const queryClient = useQueryClient()
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })
  const [isInitializing, setIsInitializing] = React.useState(false)
  const { data: protocolRecord, refetch: refetchProtocol } = useProtocolQuery(
    (runRecord?.data?.protocolId as string) ?? null,
    {
      onSuccess: () => {
        if (isInitializing) setIsInitializing(false)
      },
    }
  )

  React.useEffect(() => {
    if (protocolRecord?.data.analyses.length === 0) {
      const intervalId = setInterval(function () {
        refetchProtocol()
      }, REFETCH_INTERVAL)

      return () => clearInterval(intervalId)
    }
  }, [protocolRecord?.data.analyses])

  const { createRun, isLoading: isCreatingRun } = useCreateRunMutation({
    onSuccess: () => {
      setIsInitializing(true)
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
    },
  })
  const {
    createProtocol: createProtocolRun,
    isLoading: isCreatingProtocol,
  } = useCreateProtocolMutation({
    onSuccess: data => {
      createRun({ protocolId: data.data.id })
    },
  })

  return {
    createProtocolRun,
    protocolRecord,
    runRecord,
    isCreatingProtocolRun:
      isCreatingProtocol || isCreatingRun || isInitializing,
  }
}
