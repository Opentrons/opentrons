import { useQueryClient } from 'react-query'

import { createRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { CreateRunData, HostConfig, Run } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
  DocumentedMutationParameters,
} from '../accessControl/types'

export type UseCreateRunMutationResult = UseMutationResult<
  Run,
  AxiosError,
  CreateRunData
> & {
  createRun: UseMutateFunction<Run, AxiosError, CreateRunData>
}

export type UseCreateRunMutationOptions = UseMutationOptions<
  Run,
  AxiosError,
  CreateRunData
>

export function useCreateRunMutation(
  documentationState: DocumentationState,
  options: UseCreateRunMutationOptions = {},
  hostOverride?: HostConfig | null,
  actionsToDocument?: DocumentedAction[]
): UseCreateRunMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<Run, AxiosError, CreateRunData>(
    documentationState,
    [...(actionsToDocument ?? []), 'create_run'],
    getQueryKey(host, 'runs'),
    ({
      variables: createRunData,
      userNotes,
    }: DocumentedMutationParameters<CreateRunData>) =>
      createRun(host!, createRunData, userNotes)
        .then(response => {
          queryClient.setQueryData(
            getQueryKey(host, 'runs', response.data.data.id, 'details'),
            response.data
          )
          queryClient
            .invalidateQueries(getQueryKey(host, 'runs', 'details'))
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
          return response.data
        })
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createRun: mutation.mutate,
  }
}
