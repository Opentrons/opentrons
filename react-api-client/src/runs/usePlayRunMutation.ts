import { createRunAction, RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState } from '../access_control'

export type UsePlayRunMutationResult = UseMutationResult<
  RunAction,
  AxiosError,
  string
> & {
  playRun: UseMutateFunction<RunAction, AxiosError, string>
}

export type UsePlayRunMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const usePlayRunMutation = (
  documentationState: DocumentationState,
  options: UsePlayRunMutationOptions = {}
): UsePlayRunMutationResult => {
  const host = useHost()
  const mutation = useDocumentedMutation<RunAction, AxiosError, string>(
    documentationState,
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_PLAY),
    (runId: string) =>
      createRunAction(host!, runId, {
        actionType: RUN_ACTION_TYPE_PLAY,
      })
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    playRun: mutation.mutate,
  }
}
