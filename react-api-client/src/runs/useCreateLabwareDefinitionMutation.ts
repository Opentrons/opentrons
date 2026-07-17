import { useMutation, useQueryClient } from 'react-query'

import { createLabwareDefinition } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateAsyncFunction, UseMutationResult } from 'react-query'
import type { CreateLabwareDefinitionResponsePayload } from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'

interface CreateLabwareDefinitionParams {
  runId: string
  data: LabwareDefinition
}

export type UseCreateLabwareDefinitionMutationResult = UseMutationResult<
  CreateLabwareDefinitionResponsePayload,
  unknown,
  CreateLabwareDefinitionParams
> & {
  createLabwareDefinition: UseMutateAsyncFunction<
    CreateLabwareDefinitionResponsePayload,
    unknown,
    CreateLabwareDefinitionParams
  >
}

export function useCreateLabwareDefinitionMutation(): UseCreateLabwareDefinitionMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CreateLabwareDefinitionResponsePayload,
    unknown,
    CreateLabwareDefinitionParams
  >(({ runId, data }) =>
    createLabwareDefinition(host!, runId, data)
      .then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      })
      .catch((e: Error) => {
        console.error(`error creating labware offsets: ${e.message}`)
        throw e
      })
  )

  return {
    ...mutation,
    createLabwareDefinition: mutation.mutateAsync,
  }
}
