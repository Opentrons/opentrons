import { useQueryClient } from 'react-query'

import { dismissCurrentRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { Run } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseDismissCurrentRunMutationResult = UseMutationResult<
  Run,
  AxiosError,
  string
> & {
  dismissCurrentRun: UseMutateFunction<Run, AxiosError, string>
}

export type UseDismissCurrentRunMutationOptions = UseMutationOptions<
  Run,
  AxiosError,
  string
>

export function useDismissCurrentRunMutation(
  documentationState: DocumentationState,
  options: UseDismissCurrentRunMutationOptions = {}
): UseDismissCurrentRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<Run, AxiosError, string>(
    documentationState,
    ['dismiss_run'],
    ({ userNotes, variables: runId }: DocumentedMutationParameters<string>) =>
      dismissCurrentRun(host!, runId, userNotes).then(response => {
        queryClient.removeQueries(getQueryKey(host, 'runs', runId))
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    dismissCurrentRun: mutation.mutate,
  }
}
