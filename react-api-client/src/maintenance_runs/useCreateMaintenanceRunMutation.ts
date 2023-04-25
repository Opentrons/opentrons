import {
  HostConfig,
  MaintenanceRun,
  createMaintenanceRun,
} from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import { useHost } from '../api'
import type { AxiosError } from 'axios'

export type UseCreateMaintenanceRunMutationResult = UseMutationResult<
  MaintenanceRun,
  AxiosError,
  void
> & {
  createMaintenanceRun: UseMutateFunction<MaintenanceRun, AxiosError, void>
}

export type UseCreateMaintenanceRunMutationOptions = UseMutationOptions<
  MaintenanceRun,
  AxiosError,
  void
>

export function useCreateMaintenanceRunMutation(
  options: UseCreateMaintenanceRunMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateMaintenanceRunMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<MaintenanceRun, AxiosError>(
    [host, 'maintenance_runs'],
    () =>
      createMaintenanceRun(host as HostConfig)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createMaintenanceRun: mutation.mutate,
  }
}
