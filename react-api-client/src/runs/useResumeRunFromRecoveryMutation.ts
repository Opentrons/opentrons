import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'

import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_RESUME_FROM_RECOVERY,
  createRunAction,
} from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'

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
  options: UseResumeRunFromRecoveryMutationOptions = {}
): UseResumeRunFromRecoveryMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    [host, 'runs', RUN_ACTION_TYPE_RESUME_FROM_RECOVERY],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_RESUME_FROM_RECOVERY,
      })
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
