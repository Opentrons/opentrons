import { useMutation, useQueryClient } from 'react-query'
import { createCommand } from '@opentrons/api-client'
import { useHost } from '../api'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateAsyncFunction,
} from 'react-query'
import type {
  CommandData,
  HostConfig,
} from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

interface CreateCommandParams {
  runId: string
  command: CreateCommand
}

export type UseCreateCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateCommandParams
> & {
  createCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateCommandParams
  >
}

export type UseCreateCommandMutationOptions = UseMutationOptions<
  CommandData,
  unknown,
  CreateCommandParams
>

export function useCreateCommandMutation(): UseCreateCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<CommandData, unknown, CreateCommandParams>(
    ({ runId, command }) =>
      createCommand(host as HostConfig, runId, command).then(response => {
        queryClient
          .invalidateQueries([host, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
        return response.data
      })
  )

  return {
    ...mutation,
    createCommand: mutation.mutateAsync,
  }
}
