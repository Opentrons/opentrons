import { useQueryClient } from 'react-query'

import { deleteMaintenanceRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState, DocumentedAction } from '../access_control'
import type { DocumentedMutationParameters } from '../access_control/types'

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
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  options: UseDeleteMaintenanceRunMutationOptions = {}
): UseDeleteMaintenanceRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<EmptyResponse, unknown, string>(
    documentationState,
    actionsToDocument,
    ({
      variables: maintenanceRunId,
      userNotes,
    }: DocumentedMutationParameters<string>) =>
      deleteMaintenanceRun(host!, maintenanceRunId, userNotes).then(
        response => {
          queryClient.removeQueries(
            getQueryKey(host, 'maintenance_runs', maintenanceRunId)
          )
          queryClient
            .invalidateQueries(getQueryKey(host, 'maintenance_runs'))
            .catch((e: Error) => {
              console.error(
                `error invalidating maintenance_runs query: ${e.message}`
              )
            })
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
