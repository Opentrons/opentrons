import * as React from 'react'
import { useQueryClient } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

import type { UseMutateFunction } from 'react-query'
import type { Protocol } from '@opentrons/api-client'
import type { UseCreateRunMutationOptions } from '@opentrons/react-api-client/src/runs/useCreateRunMutation'

export interface UseCreateRun {
  createRun: UseMutateFunction<Protocol, unknown, File[], unknown>
  isCreatingRun: boolean
  runCreationError: string | null
}

export function useCreateRunFromProtocol(
  options: UseCreateRunMutationOptions
): UseCreateRun {
  const host = useHost()
  const queryClient = useQueryClient()
  const [runCreationError, setRunCreationError] = React.useState<string | null>(
    null
  )

  const { createRun, isLoading: isCreatingRun } = useCreateRunMutation({
    ...options,
    onSuccess: (...args) => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
      options.onSuccess?.(...args)
    },
    onError: error => {
      setRunCreationError(error.response?.data.errors[0].detail ?? null)
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
      setRunCreationError(error.response?.data.errors[0].detail ?? null)
    },
  })

  return {
    createRun: (...args) => {
      setRunCreationError(null)
      // TODO: include protocol key in protocol record creation
      createProtocolRun(...args)
    },
    isCreatingRun: isCreatingProtocol || isCreatingRun,
    runCreationError,
  }
}
