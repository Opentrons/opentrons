import { useCallback } from 'react'
import { useQueryClient } from 'react-query'

import { createLiveCommand } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { modulesQueryKey } from '../modules'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { CommandData, CreateCommandParams } from '@opentrons/api-client'
import type { CreateCommand, RunTimeCommand } from '@opentrons/shared-data'
import type { DocumentationState, DocumentedAction } from '../accessControl'

export interface CreateLiveCommandMutateParams extends CreateCommandParams {
  command: CreateCommand
  waitUntilComplete?: boolean
  timeout?: number
}

export type UseCreateLiveCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateLiveCommandMutateParams
> & {
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams
  >
}

export type UseCreateCommandMutationOptions = UseMutationOptions<
  CommandData,
  unknown,
  CreateLiveCommandMutateParams
>

export function useCreateLiveCommandMutation(
  documentationState: DocumentationState,
  actionsToDocument?: DocumentedAction[],
  addActionToDocument?: (action: DocumentedAction) => void
): UseCreateLiveCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const generatedActions = useLiveCommandActionsToDocument()

  const mutation = useDocumentedMutation<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams
  >(
    documentationState,
    actionsToDocument ?? generatedActions,
    ({ variables: { command, waitUntilComplete, timeout }, userNotes }) => {
      return createLiveCommand(
        host!,
        command,
        {
          waitUntilComplete,
          timeout,
        },
        userNotes
      ).then(response => {
        queryClient
          .invalidateQueries(modulesQueryKey(host))
          .catch((e: Error) => {
            console.error(
              `error invalidating live commands query: ${e.message}`
            )
          })
        addActionToDocument?.(response.data.data)
        return response.data
      })
    }
  )

  return {
    ...mutation,
    createLiveCommand: mutation.mutateAsync,
  }
}

function unsafeCreateCommandToRunTimeCommand(
  command: CreateCommand
): RunTimeCommand {
  // jj 7/14/26: I know this looks bad. CommandText only takes in RunTimeCommands,
  // but only ever really uses the data thats already present in CreateCommand.
  // By lying to TypeScript we can avoid having to write like 500 lines of changes to CommandText.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    ...command,
    id: 'pending',
    status: 'queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  } as RunTimeCommand
}

function useLiveCommandActionsToDocument(): (
  variables: CreateLiveCommandMutateParams
) => DocumentedAction[] {
  return useCallback((variables: CreateLiveCommandMutateParams) => {
    return [unsafeCreateCommandToRunTimeCommand(variables.command)]
  }, [])
}
