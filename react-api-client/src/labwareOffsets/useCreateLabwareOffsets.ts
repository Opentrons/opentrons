import { useQueryClient } from 'react-query'

import { createLabwareOffsets } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CreateLabwareOffsetData,
  StoredLabwareOffset,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseCreateLabwareOffsetsMutationResult = UseMutationResult<
  StoredLabwareOffset | StoredLabwareOffset[],
  unknown,
  CreateLabwareOffsetData
> & {
  createLabwareOffsets: UseMutateAsyncFunction<
    StoredLabwareOffset | StoredLabwareOffset[],
    unknown,
    CreateLabwareOffsetData
  >
}

export type UseCreateLabwareOffsetsMutationOptions = UseMutationOptions<
  StoredLabwareOffset | StoredLabwareOffset[],
  unknown,
  CreateLabwareOffsetData
>

export function useCreateLabwareOffsetsMutation(
  documentationState: DocumentationState,
  options: UseCreateLabwareOffsetsMutationOptions = {}
): UseCreateLabwareOffsetsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    StoredLabwareOffset | StoredLabwareOffset[],
    unknown,
    CreateLabwareOffsetData
  >(
    documentationState,
    ['create_offsets'],
    getQueryKey(host, 'labwareOffsets'),
    ({
      variables: data,
      userNotes,
    }: DocumentedMutationParameters<CreateLabwareOffsetData>) =>
      createLabwareOffsets(host!, data, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'labwareOffsets'))
          .catch((e: Error) => {
            console.error(
              `error invalidating labwareOffsets query: ${e.message}`
            )
          })
        return response.data.data
      }),
    options
  )

  return {
    ...mutation,
    createLabwareOffsets: mutation.mutateAsync,
  }
}
