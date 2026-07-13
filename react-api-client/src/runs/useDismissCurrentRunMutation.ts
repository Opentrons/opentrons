import { useQueryClient } from 'react-query'

import { dismissCurrentRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseDismissCurrentRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  dismissCurrentRun: UseMutateFunction<EmptyResponse, unknown, string>
}

export type UseDismissCurrentRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDismissCurrentRunMutation(
  documentationState: DocumentationState,
  options: UseDismissCurrentRunMutationOptions = {}
): UseDismissCurrentRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<EmptyResponse, unknown, string>(
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
