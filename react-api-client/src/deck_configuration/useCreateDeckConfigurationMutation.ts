import { useMutation, useQueryClient } from 'react-query'
import { createDeckConfiguration } from '@opentrons/api-client'
import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { AxiosError } from 'axios'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ErrorResponse, HostConfig } from '@opentrons/api-client'

const DECK_CONFIGURATION = 'deck_configuration'

export type UseCreateDeckConfigurationMutationResult = UseMutationResult<
  DeckConfiguration,
  AxiosError<ErrorResponse>,
  DeckConfiguration
> & {
  createDeckConfiguration: UseMutateFunction<
    DeckConfiguration,
    AxiosError<ErrorResponse>,
    DeckConfiguration
  >
}

export type UseCreateDeckConfigurationMutationOptions = UseMutationOptions<
  DeckConfiguration,
  AxiosError<ErrorResponse>,
  DeckConfiguration
>

export function useCreateDeckConfigurationMutation(
  options: UseCreateDeckConfigurationMutationOptions = {}
): UseCreateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    DeckConfiguration,
    AxiosError<ErrorResponse>,
    DeckConfiguration
  >(
    [host, DECK_CONFIGURATION],
    (deckConfiguration: DeckConfiguration) =>
      createDeckConfiguration(host as HostConfig, deckConfiguration).then(
        response => {
          queryClient
            .invalidateQueries([host, DECK_CONFIGURATION])
            .catch((error: Error) => {
              throw error
            })
          return response.data
        }
      ),
    options
  )
  return {
    ...mutation,
    createDeckConfiguration: mutation.mutate,
  }
}
