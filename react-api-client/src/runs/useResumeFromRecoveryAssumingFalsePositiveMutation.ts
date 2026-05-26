import { useMutation } from 'react-query'

import {
  createRunAction,
  RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
} from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'

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
  options: UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions = {}
): UseResumeRunFromRecoveryAssumingFalsePositiveMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    getQueryKey(
      host,
      'runs',
      RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE
    ),
    (runId: string) =>
      createRunAction(host!, runId, {
        actionType:
          RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
      })
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
