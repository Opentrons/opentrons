import { useMutation, useQueryClient } from 'react-query'
import { createMaintenanceCommand } from '@opentrons/api-client'
import { useHost } from '../api'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateAsyncFunction,
} from 'react-query'
import type {
  CommandData,
  HostConfig,
  CreateCommandParams,
} from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'

interface CreateMaintenanceCommandMutateParams extends CreateCommandParams {
  maintenanceRunId: string
  command: CreateCommand
  waitUntilComplete?: boolean
  timeout?: number
}

export type UseCreateMaintenanceCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateMaintenanceCommandMutateParams
> & {
  createMaintenanceCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateMaintenanceCommandMutateParams
  >
}

export type UseCreateMaintenanceCommandMutationOptions = UseMutationOptions<
  CommandData,
  unknown,
  CreateMaintenanceCommandMutateParams
>

export function useCreateMaintenanceCommandMutation(): UseCreateMaintenanceCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CommandData,
    unknown,
    CreateMaintenanceCommandMutateParams
  >(({ maintenanceRunId, command, waitUntilComplete, timeout }) =>
    createMaintenanceCommand(host as HostConfig, maintenanceRunId, command, {
      waitUntilComplete,
      timeout,
    }).then(response => {
      queryClient
        .invalidateQueries([host, 'maintenance_runs'])
        .catch((e: Error) =>
          console.error(
            `error invalidating maintenance runs query: ${e.message}`
          )
        )
      return response.data
    })
  )

  return {
    ...mutation,
    createMaintenanceCommand: mutation.mutateAsync,
  }
}
