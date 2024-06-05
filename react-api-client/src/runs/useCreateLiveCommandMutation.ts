import { useMutation, useQueryClient } from 'react-query'
import { createLiveCommand } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
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
import type { CreateCommand } from '@opentrons/shared-data'

export interface CreateLiveCommandMutateParams extends CreateCommandParams {
  command: CreateCommand
  waitUntilComplete?: boolean
  timeout?: number
}

export type UseCreateLiveCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateLiveCommandMutateParams
> & {
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams
  >
}

export type UseCreateCommandMutationOptions = UseMutationOptions<
  CommandData,
  unknown,
  CreateLiveCommandMutateParams
>

export function useCreateLiveCommandMutation(): UseCreateLiveCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const mutation = useMutation<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams
  >(({ command, waitUntilComplete, timeout }) =>
    createLiveCommand(sanitizedHost as HostConfig, command, {
      waitUntilComplete,
      timeout,
    }).then(response => {
      queryClient
        .invalidateQueries([sanitizedHost, 'commands'])
        .catch((e: Error) =>
          console.error(`error invalidating commands query: ${e.message}`)
        )
      return response.data
    })
  )

  return {
    ...mutation,
    createLiveCommand: mutation.mutateAsync,
  }
}
