import {
  UseMutationResult,
  UseMutationOptions,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'

import { updateDeckConfiguration } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { ErrorResponse, HostConfig } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'

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
  options: UseUpdateDeckConfigurationMutationOptions = {}
): UseUpdateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    DeckConfiguration,
    AxiosError<ErrorResponse>,
    DeckConfiguration
  >(
    [host, 'deck_configuration'],
    (deckConfig: DeckConfiguration) =>
      updateDeckConfiguration(host as HostConfig, deckConfig).then(response => {
        queryClient
          .invalidateQueries([host, 'deck_configuration'])
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
