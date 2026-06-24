import { createRunAction, RUN_ACTION_TYPE_STOP } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState, DocumentedAction } from '../access_control'
import type { DocumentedMutationParameters } from '../access_control/types'

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
  actionsToDocument?: DocumentedAction[],
  options?: UseStopRunMutationOptions
): UseStopRunMutationResult => {
  const host = useHost()
  const actions: DocumentedAction[] = [...(actionsToDocument ?? []), 'stop_run']
  const mutation = useDocumentedMutation<RunAction, unknown, string>(
    documentationState,
    actions,
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_STOP),
    ({ variables: runId, userNotes }: DocumentedMutationParameters<string>) =>
      createRunAction(
        host!,
        runId,
        {
          actionType: RUN_ACTION_TYPE_STOP,
        },
        userNotes
      ).then(response => response.data),
    options
  )
  return {
    ...mutation,
    stopRun: mutation.mutate,
  }
}
