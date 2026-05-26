import { useMutation, useQueryClient } from 'react-query'

import { createCommand } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateAsyncFunction, UseMutationResult } from 'react-query'
import type { CommandData, CreateCommandParams } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'

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

export function useCreateCommandMutation(): UseCreateCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<CommandData, unknown, CreateCommandMutateParams>(
    params => {
      const { runId, command, ...rest } = params

      return createCommand(host!, runId, command, {
        ...rest,
      }).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      })
    }
  )

  return {
    ...mutation,
    createCommand: mutation.mutateAsync,
  }
}
