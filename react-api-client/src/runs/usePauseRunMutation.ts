import { createRunAction, RUN_ACTION_TYPE_PAUSE } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UsePauseRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  pauseRun: UseMutateFunction<RunAction, unknown, string>
}

export type UsePauseRunMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const usePauseRunMutation = (
  documentationState: DocumentationState,
  options: UsePauseRunMutationOptions = {}
): UsePauseRunMutationResult => {
  const host = useHost()
  const mutation = useDocumentedMutation<RunAction, AxiosError, string>(
    documentationState,
    ['pause_run'],
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_PAUSE),
    ({ variables: runId, userNotes }) =>
      createRunAction(
        host!,
        runId,
        {
          actionType: RUN_ACTION_TYPE_PAUSE,
        },
        userNotes
      )
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    pauseRun: mutation.mutate,
  }
}
