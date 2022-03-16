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
  CreateCommandParams,
} from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

interface CreateCommandMutateParams extends CreateCommandParams {
  runId: string
  command: CreateCommand
  waitUntilComplete?: boolean
  timeout?: number
}

export type UseCreateCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateCommandMutateParams
> & {
  createCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateCommandMutateParams
  >
}

export type UseCreateCommandMutationOptions = UseMutationOptions<
  CommandData,
  unknown,
  CreateCommandMutateParams
>

export function useCreateCommandMutation(): UseCreateCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<CommandData, unknown, CreateCommandMutateParams>(
    ({ runId, command, waitUntilComplete, timeout }) =>
      createCommand(host as HostConfig, runId, command, {
        waitUntilComplete,
        timeout,
      }).then(response => {
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
