import { createRunAction, RUN_ACTION_TYPE_STOP } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState } from '../access_control'

export type UseStopRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  stopRun: UseMutateFunction<RunAction, unknown, string>
}

export type UseStopRunMutationOptions = UseMutationOptions<
  RunAction,
  unknown,
  string
>

export const useStopRunMutation = (
  documentationState: DocumentationState,
  options?: UseStopRunMutationOptions
): UseStopRunMutationResult => {
  const host = useHost()
  const mutation = useDocumentedMutation<RunAction, unknown, string>(
    documentationState,
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_STOP),
    (runId: string) =>
      createRunAction(host!, runId, {
        actionType: RUN_ACTION_TYPE_STOP,
      }).then(response => response.data),
    options
  )
  return {
    ...mutation,
    stopRun: mutation.mutate,
  }
}
