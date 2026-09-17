import { useQueryClient } from 'react-query'

import { signRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl/useDocumentedMutation'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseSignRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export type UseSignRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  { runId: string; name: string }
> & {
  signRun: UseMutateFunction<
    EmptyResponse,
    unknown,
    { runId: string; name: string }
  >
}

export function useSignRunMutation(
  documentationState: DocumentationState,
  options: UseSignRunMutationOptions = {}
): UseSignRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    EmptyResponse,
    unknown,
    { runId: string; name: string }
  >(
    documentationState,
    ['sign_run'],
    ({
      userNotes,
      variables: { runId, name },
    }: DocumentedMutationParameters<{ runId: string; name: string }>) =>
      signRun(host!, runId, name, userNotes).then(response => {
        queryClient.removeQueries(getQueryKey(host, 'runs', runId))
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      })
  )

  return {
    ...mutation,
    signRun: mutation.mutate,
  }
}
