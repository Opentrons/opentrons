import { useMutation, useQueryClient } from 'react-query'
import { createCommand } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type { AnonymousCommand, CommandData } from '@opentrons/api-client'

interface CreateCommandParams {
  runId: string
  command: AnonymousCommand
}

export type UseCreateCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateCommandParams
> & {
  createCommand: UseMutateFunction<CommandData, unknown, CreateCommandParams>
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
        queryClient.removeQueries([host, 'runs', runId])
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
    createCommand: mutation.mutate,
  }
}
