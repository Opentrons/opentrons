import { useQueryClient } from 'react-query'

import { updateDeckConfiguration } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { ErrorResponse } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { DocumentationState } from '../accessControl'

export type UseUpdateDeckConfigurationMutationResult = UseMutationResult<
  DeckConfiguration,
  AxiosError<ErrorResponse>,
  DeckConfiguration
> & {
  updateDeckConfiguration: UseMutateFunction<
    DeckConfiguration,
    AxiosError<ErrorResponse>,
    DeckConfiguration
  >
}

export type UseUpdateDeckConfigurationMutationOptions = UseMutationOptions<
  DeckConfiguration,
  AxiosError<ErrorResponse>,
  DeckConfiguration
>

export function useUpdateDeckConfigurationMutation(
  documentationState: DocumentationState,
  options: UseUpdateDeckConfigurationMutationOptions = {}
): UseUpdateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    DeckConfiguration,
    AxiosError<ErrorResponse>,
    DeckConfiguration
  >(
    documentationState,
    ['update_deck_configuration'],
    getQueryKey(host, 'deck_configuration'),
    ({ variables: deckConfig, userNotes }) =>
      updateDeckConfiguration(host!, deckConfig, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'deck_configuration'))
          .catch((e: Error) => {
            throw e
          })
        return response.data?.data?.cutoutFixtures ?? []
      }),
    options
  )
  return {
    ...mutation,
    updateDeckConfiguration: mutation.mutate,
  }
}
