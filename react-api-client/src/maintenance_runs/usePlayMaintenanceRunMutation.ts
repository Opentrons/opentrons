import {
  HostConfig,
  RunAction,
  MAINTENANCE_RUN_ACTION_TYPE_PLAY,
  createRunAction,
} from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import { useHost } from '../api'

import type { AxiosError } from 'axios'

export type UsePlayMaintenanceRunMutationResult = UseMutationResult<
  RunAction,
  AxiosError,
  string
> & {
  playMaintenanceRun: UseMutateFunction<RunAction, AxiosError, string>
}

export type UsePlayMaintenanceRunMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const usePlayMaintenanceRunMutation = (
  options: UsePlayMaintenanceRunMutationOptions = {}
): UsePlayMaintenanceRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    [host, 'maintenance_runs', MAINTENANCE_RUN_ACTION_TYPE_PLAY],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: MAINTENANCE_RUN_ACTION_TYPE_PLAY,
      })
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    playMaintenanceRun: mutation.mutate,
  }
}
