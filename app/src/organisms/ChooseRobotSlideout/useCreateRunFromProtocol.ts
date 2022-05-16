import * as React from 'react'
import { useQueryClient } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'
import { getValidCustomLabwareFiles } from '../../redux/custom-labware/selectors'

import type { UseMutateFunction } from 'react-query'
import type { Protocol } from '@opentrons/api-client'
import type { UseCreateRunMutationOptions } from '@opentrons/react-api-client/src/runs/useCreateRunMutation'
import type { CreateProtocolVariables } from '@opentrons/react-api-client/src/protocols/useCreateProtocolMutation'
import type { State } from '../../redux/types'

export interface UseCreateRun {
  createRunFromProtocolSource: UseMutateFunction<
    Protocol,
    unknown,
    CreateProtocolVariables,
    unknown
  >
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

  const customLabwareFiles = useSelector((state: State) =>
    getValidCustomLabwareFiles(state)
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
    createRunFromProtocolSource: (
      { files: srcFiles, protocolKey },
      ...args
    ) => {
      setRunCreationError(null)
      createProtocolRun(
        { files: [...srcFiles, ...customLabwareFiles], protocolKey },
        ...args
      )
    },
    isCreatingRun: isCreatingProtocol || isCreatingRun,
    runCreationError,
  }
}
