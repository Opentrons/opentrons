import * as React from 'react'
import last from 'lodash/last'
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
  const enableProtocolPolling = React.useRef<boolean>(
    runRecord?.data.protocolId != null
  )
  const { data: protocolRecord } = useProtocolQuery(
    (runRecord?.data?.protocolId as string) ?? null,
    {
      onSuccess: () => {
        if (isInitializing) setIsInitializing(false)
      },
    },
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
      runRecord?.data.protocolId != null &&
      !enableProtocolPolling.current &&
      mostRecentAnalysis?.status !== 'completed'
    ) {
      enableProtocolPolling.current = true
    }
  }, [mostRecentAnalysis?.status, runRecord?.data.protocolId])

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
