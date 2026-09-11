import { createRunAction, RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState, DocumentedAction } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

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
  actionsToDocument?: DocumentedAction[],
  options: UsePlayRunMutationOptions = {}
): UsePlayRunMutationResult => {
  const host = useHost()
  const actions: DocumentedAction[] = [...(actionsToDocument ?? []), 'play_run']
  const mutation = useDocumentedMutation<RunAction, AxiosError, string>(
    documentationState,
    actions,
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_PLAY),
    ({ variables: runId, userNotes }: DocumentedMutationParameters<string>) =>
      createRunAction(
        host!,
        runId,
        {
          actionType: RUN_ACTION_TYPE_PLAY,
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
    playRun: mutation.mutate,
  }
}
