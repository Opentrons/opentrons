import * as React from 'react'
import { useQueryClient } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

import type { UseMutateFunction } from 'react-query'
import type { Protocol } from '@opentrons/api-client'

export interface UseCreateRun {
  createProtocolRun: UseMutateFunction<Protocol, unknown, File[], unknown>
  isCreatingProtocolRun?: boolean
  protocolCreationError: string | null
}

export function useCreateRun(): UseCreateRun {
  const host = useHost()
  const queryClient = useQueryClient()
  const [protocolCreationError, setProtocolCreationError] = React.useState<
    string | null
  >(null)

  const { createRun, isLoading: isCreatingRun } = useCreateRunMutation({
    onSuccess: () => {
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
    onError: error => {
      setProtocolCreationError(error.response?.data.errors[0].detail ?? null)
    },
  })

  return {
    createProtocolRun: (...args) => {
      setProtocolCreationError(null)
      createProtocolRun(...args)
    },
    isCreatingProtocolRun: isCreatingProtocol || isCreatingRun,
    protocolCreationError,
  }
}
