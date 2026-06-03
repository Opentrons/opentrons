import { useQueryClient } from 'react-query'

import { createMaintenanceCommand } from '@opentrons/api-client'

import { useDocumentedMutation } from '../access_control'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { CommandData, CreateCommandParams } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { DocumentationState, DocumentedAction } from '../access_control'
import type { DocumentedMutationParameters } from '../access_control/types'

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
      variables: { maintenanceRunId, command, waitUntilComplete, timeout },
      userNotes,
    }: DocumentedMutationParameters<CreateMaintenanceCommandMutateParams>) =>
      createMaintenanceCommand(
        host!,
        maintenanceRunId,
        command,
        {
          waitUntilComplete,
          timeout,
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
