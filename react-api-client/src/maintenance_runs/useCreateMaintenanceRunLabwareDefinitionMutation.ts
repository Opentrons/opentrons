import { useMutation, useQueryClient } from 'react-query'

import { createMaintenanceRunLabwareDefinition } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { LabwareDefinitionSummary } from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'

interface CreateMaintenanceRunLabwareDefinitionMutateParams {
  maintenanceRunId: string
  labwareDef: LabwareDefinition
}

export type UseCreateLabwareDefinitionMutationResult = UseMutationResult<
  LabwareDefinitionSummary,
  unknown,
  CreateMaintenanceRunLabwareDefinitionMutateParams
> & {
  createLabwareDefinition: UseMutateAsyncFunction<
    LabwareDefinitionSummary,
    unknown,
    CreateMaintenanceRunLabwareDefinitionMutateParams
  >
}

export type UseCreateLabwareDefinitionMutationOptions = UseMutationOptions<
  LabwareDefinitionSummary,
  unknown,
  CreateMaintenanceRunLabwareDefinitionMutateParams
>

export function useCreateMaintenanceRunLabwareDefinitionMutation(): UseCreateLabwareDefinitionMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    LabwareDefinitionSummary,
    unknown,
    CreateMaintenanceRunLabwareDefinitionMutateParams
  >(({ maintenanceRunId, labwareDef }) =>
    createMaintenanceRunLabwareDefinition(
      host!,
      maintenanceRunId,
      labwareDef
    ).then(response => {
      queryClient
        .invalidateQueries(getQueryKey(host, 'maintenance_runs'))
        .catch((e: Error) => {
          console.error(
            `error invalidating maintenance runs query: ${e.message}`
          )
        })
      return response.data
    })
  )

  return {
    ...mutation,
    createLabwareDefinition: mutation.mutateAsync,
  }
}
