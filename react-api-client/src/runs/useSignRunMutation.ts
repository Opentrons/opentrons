import { useQueryClient } from 'react-query'

import { signRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl/useDocumentedMutation'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { Run } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseSignRunMutationOptions = UseMutationOptions<Run, unknown, string>

export type UseSignRunMutationResult = UseMutationResult<
  Run,
  unknown,
  { runId: string; name: string }
> & {
  signRun: UseMutateFunction<Run, unknown, { runId: string; name: string }>
}

export function useSignRunMutation(
  documentationState: DocumentationState,
  options: UseSignRunMutationOptions = {}
): UseSignRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    Run,
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
        queryClient.setQueryData(
          getQueryKey(host, 'runs', runId, 'details'),
          response.data
        )
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs', 'details'))
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
