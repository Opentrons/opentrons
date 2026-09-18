import {
  createRunAction,
  RUN_ACTION_TYPE_RESUME_FROM_RECOVERY,
} from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseResumeRunFromRecoveryMutationResult = UseMutationResult<
  RunAction,
  AxiosError,
  string
> & {
  resumeRunFromRecovery: UseMutateFunction<RunAction, AxiosError, string>
}

export type UseResumeRunFromRecoveryMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const useResumeRunFromRecoveryMutation = (
  documentationState: DocumentationState,
  options: UseResumeRunFromRecoveryMutationOptions = {}
): UseResumeRunFromRecoveryMutationResult => {
  const host = useHost()
  const mutation = useDocumentedMutation<RunAction, AxiosError, string>(
    documentationState,
    ['resume_run_from_recovery'],
    ({ variables: runId, userNotes }) =>
      createRunAction(
        host!,
        runId,
        {
          actionType: RUN_ACTION_TYPE_RESUME_FROM_RECOVERY,
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
    resumeRunFromRecovery: mutation.mutate,
  }
}
