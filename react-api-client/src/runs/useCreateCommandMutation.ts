import { useQueryClient } from 'react-query'

import { createCommand } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { UseMutateAsyncFunction, UseMutationResult } from 'react-query'
import type { CommandData, CreateCommandParams } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { DocumentationState, DocumentedAction } from '../accessControl'

interface CreateCommandMutateParams extends CreateCommandParams {
  runId: string
  command: CreateCommand
  waitUntilComplete?: boolean
  timeout?: number
}

export type UseCreateCommandMutationResult = UseMutationResult<
  CommandData,
  unknown,
  CreateCommandMutateParams
> & {
  createCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateCommandMutateParams
  >
}

export function useCreateCommandMutation(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  addActionToDocument: (action: DocumentedAction) => void
): UseCreateCommandMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    CommandData,
    unknown,
    CreateCommandMutateParams
  >(documentationState, actionsToDocument, ({ variables, userNotes }) => {
    const { runId, command, ...rest } = variables

    return createCommand(
      host!,
      runId,
      command,
      {
        ...rest,
      },
      userNotes
    ).then(response => {
      queryClient
        .invalidateQueries(getQueryKey(host, 'runs'))
        .catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
      addActionToDocument(response.data.data)
      return response.data
    })
  })

  return {
    ...mutation,
    createCommand: mutation.mutateAsync,
  }
}
