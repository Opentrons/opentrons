import { useHost } from '../api'
import { createLabwareDefinition } from '@opentrons/api-client'
import type {
  HostConfig,
  CreateLabwareDefinitionResponsePayload,
} from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { useMutation, useQueryClient } from 'react-query'
import type { UseMutationResult, UseMutateAsyncFunction } from 'react-query'

interface CreateLabwareDefinitionParams {
  runId: string
  data: LabwareDefinition2
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
    createLabwareDefinition(host as HostConfig, runId, data)
      .then(response => {
        queryClient
          .invalidateQueries([host, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
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
