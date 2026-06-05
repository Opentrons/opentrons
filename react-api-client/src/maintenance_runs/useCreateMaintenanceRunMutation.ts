import { useQueryClient } from 'react-query'

import { createMaintenanceRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CreateMaintenanceRunData,
  HostConfig,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { DocumentationState } from '../access_control'

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
  documentationState: DocumentationState,
  options: UseCreateMaintenanceRunMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateMaintenanceRunMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<
    MaintenanceRun,
    AxiosError,
    CreateMaintenanceRunData
  >(
    documentationState,
    getQueryKey(host, 'maintenance_runs'),
    (createMaintenanceRunData = {}) =>
      createMaintenanceRun(host!, createMaintenanceRunData)
        .then(response => response.data)
        .catch(e => {
          queryClient.invalidateQueries(
            getQueryKey(host, 'robot/control/estopStatus')
          )
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createMaintenanceRun: mutation.mutateAsync,
  }
}
