import {
  createRunAction,
  RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
} from '@opentrons/api-client'

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

export type UseResumeRunFromRecoveryAssumingFalsePositiveMutationResult =
  UseMutationResult<RunAction, AxiosError, string> & {
    resumeRunFromRecoveryAssumingFalsePositive: UseMutateFunction<
      RunAction,
      AxiosError,
      string
    >
  }

export type UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions =
  UseMutationOptions<RunAction, AxiosError, string>

export const useResumeRunFromRecoveryAssumingFalsePositiveMutation = (
  documentationState: DocumentationState,
  options: UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions = {}
): UseResumeRunFromRecoveryAssumingFalsePositiveMutationResult => {
  const host = useHost()
  const mutation = useDocumentedMutation<RunAction, AxiosError, string>(
    documentationState,
    ['resume_run_from_recovery'],
    getQueryKey(
      host,
      'runs',
      RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE
    ),
    ({ variables: runId, userNotes }) =>
      createRunAction(
        host!,
        runId,
        {
          actionType:
            RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
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
    resumeRunFromRecoveryAssumingFalsePositive: mutation.mutate,
  }
}
