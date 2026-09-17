import { useQueryClient } from 'react-query'

import { createMaintenanceCommand } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CommandData,
  CreateMaintenanceCommandParams,
} from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { DocumentationState, DocumentedAction } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

interface CreateMaintenanceCommandMutateParams extends CreateMaintenanceCommandParams {
  maintenanceRunId: string
  command: CreateCommand
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

export function useCreateMaintenanceCommandMutation(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  addActionToDocument: (action: DocumentedAction) => void
): UseCreateMaintenanceCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    CommandData,
    unknown,
    CreateMaintenanceCommandMutateParams
  >(
    documentationState,
    actionsToDocument,
    ({
      variables: {
        maintenanceRunId,
        command,
        waitUntilComplete,
        timeout,
        requiresClosedDoor = true,
      },
      userNotes,
    }: DocumentedMutationParameters<CreateMaintenanceCommandMutateParams>) =>
      createMaintenanceCommand(
        host!,
        maintenanceRunId,
        command,
        {
          waitUntilComplete,
          timeout,
          requiresClosedDoor,
        },
        userNotes
      )
        .then(response => {
          queryClient
            .invalidateQueries(getQueryKey(host, 'maintenance_runs'))
            .catch((e: Error) => {
              console.error(
                `error invalidating maintenance runs query: ${e.message}`
              )
            })

          addActionToDocument(response.data.data)
          return response.data
        })
        .catch((e: any) => {
          queryClient.invalidateQueries(
            getQueryKey(host, 'robot/control/estopStatus')
          )
          throw e
        })
  )

  return {
    ...mutation,
    createMaintenanceCommand: mutation.mutateAsync,
  }
}
