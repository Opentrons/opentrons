import { useMutation } from 'react-query'

import {
  RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
  createRunAction,
} from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, RunAction } from '@opentrons/api-client'

export type UseResumeRunFromRecoveryAssumingFalsePositiveMutationResult = UseMutationResult<
  RunAction,
  AxiosError,
  string
> & {
  resumeRunFromRecoveryAssumingFalsePositive: UseMutateFunction<
    RunAction,
    AxiosError,
    string
  >
}

export type UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const useResumeRunFromRecoveryAssumingFalsePositiveMutation = (
  options: UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions = {}
): UseResumeRunFromRecoveryAssumingFalsePositiveMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    [
      host,
      'runs',
      RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
    ],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE,
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
