import { createMaintenanceRun } from '@opentrons/api-client'
import { useMutation } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutateAsyncFunction,
  UseMutationOptions,
} from 'react-query'
import type {
  CreateMaintenanceRunData,
  HostConfig,
  MaintenanceRun,
} from '@opentrons/api-client'

export type CreateMaintenanceRunType = UseMutateAsyncFunction<
  MaintenanceRun,
  AxiosError,
  CreateMaintenanceRunData
>

export type UseCreateMaintenanceRunMutationResult = UseMutationResult<
  MaintenanceRun,
  AxiosError,
  CreateMaintenanceRunData
> & {
  createMaintenanceRun: CreateMaintenanceRunType
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
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<
    MaintenanceRun,
    AxiosError,
    CreateMaintenanceRunData
  >(
    [getSanitizedQueryKeyObject(host), 'maintenance_runs'],
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
    createMaintenanceRun: mutation.mutateAsync,
  }
}
