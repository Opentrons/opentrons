import { useMutation, useQueryClient } from 'react-query'
import { createMaintenanceRunLabwareDefinition } from '@opentrons/api-client'
import { useHost } from '../api'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateAsyncFunction,
} from 'react-query'
import type {
  LabwareDefinitionSummary,
  HostConfig,
} from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type UseCreateLabwareDefinitionMutationResult = UseMutationResult<
  LabwareDefinitionSummary,
  unknown,
  LabwareDefinition2
> & {
  createLabwareDefinition: UseMutateAsyncFunction<
    LabwareDefinitionSummary,
    unknown,
    LabwareDefinition2
  >
}

export type UseCreateLabwareDefinitionMutationOptions = UseMutationOptions<
  LabwareDefinitionSummary,
  unknown,
  LabwareDefinition2
>

export function useCreateLabwareDefinitionMutation(
  maintenanceRunId: string
): UseCreateLabwareDefinitionMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    LabwareDefinitionSummary,
    unknown,
    LabwareDefinition2
  >((labwareDef: LabwareDefinition2) =>
    createMaintenanceRunLabwareDefinition(host as HostConfig, maintenanceRunId, labwareDef).then(response => {
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
    createLabwareDefinition: mutation.mutateAsync,
  }
}
