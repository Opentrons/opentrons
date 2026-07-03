import { useQueryClient } from 'react-query'

import { createMaintenanceRunLabwareDefinition } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { LabwareDefinitionSummary } from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

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

// This is a weird outlier for documented mutations.
// Its only used to setup defs for the LPC flow,
// so while it needs to pass in the documentation state,
// it doesn't need to be listed as a separate action at the end of the flow.
export function useCreateMaintenanceRunLabwareDefinitionMutation(
  documentationState: DocumentationState
): UseCreateLabwareDefinitionMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    LabwareDefinitionSummary,
    unknown,
    CreateMaintenanceRunLabwareDefinitionMutateParams
  >(
    documentationState,
    ['lpc_flow'],
    ({
      variables: { maintenanceRunId, labwareDef },
      userNotes,
    }: DocumentedMutationParameters<CreateMaintenanceRunLabwareDefinitionMutateParams>) =>
      createMaintenanceRunLabwareDefinition(
        host!,
        maintenanceRunId,
        labwareDef,
        userNotes
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
