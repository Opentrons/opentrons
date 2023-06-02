import { useMutation, useQueryClient } from 'react-query'
import { deleteMaintenanceRun } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'

export type UseDeleteMaintenanceRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteMaintenanceRun: UseMutateFunction<EmptyResponse, unknown, string>
}

export type UseDeleteMaintenanceRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDeleteMaintenanceRunMutation(
  options: UseDeleteMaintenanceRunMutationOptions = {}
): UseDeleteMaintenanceRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (maintenanceRunId: string) =>
      deleteMaintenanceRun(host as HostConfig, maintenanceRunId).then(
        response => {
          queryClient.removeQueries([
            host,
            'maintenance_runs',
            maintenanceRunId,
          ])
          queryClient
            .invalidateQueries([host, 'maintenance_runs'])
            .catch((e: Error) =>
              console.error(
                `error invalidating maintenance_runs query: ${e.message}`
              )
            )
          return response.data
        }
      ),
    options
  )

  return {
    ...mutation,
    deleteMaintenanceRun: mutation.mutate,
  }
}
