import {
  HostConfig,
  MaintenanceRun,
  createMaintenanceRun,
  CreateMaintenanceRunData,
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
  CreateMaintenanceRunData
> & {
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError,
    CreateMaintenanceRunData
  >
}

export type UseCreateMaintenanceRunMutationOptions = UseMutationOptions<
  MaintenanceRun,
  AxiosError,
  CreateMaintenanceRunData
>

export function useCreateMaintenanceRunMutation(
  options: UseCreateMaintenanceRunMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateMaintenanceRunMutationResult {
  const contextHost = useHost()
  const host = hostOverride ?? contextHost
  const mutation = useMutation<
    MaintenanceRun,
    AxiosError,
    CreateMaintenanceRunData
  >(
    [host, 'maintenance_runs'],
    (createMaintenanceRunData = {}) =>
      createMaintenanceRun(host as HostConfig, createMaintenanceRunData)
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
