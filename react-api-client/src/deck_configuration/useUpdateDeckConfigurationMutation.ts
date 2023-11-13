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
import type { Fixture } from '@opentrons/shared-data'

export type UseUpdateDeckConfigurationMutationResult = UseMutationResult<
  Fixture,
  AxiosError<ErrorResponse>,
  Fixture
> & {
  updateDeckConfiguration: UseMutateFunction<
    Fixture,
    AxiosError<ErrorResponse>,
    Fixture
  >
}

export type UseUpdateDeckConfigurationMutationOptions = UseMutationOptions<
  Fixture,
  AxiosError<ErrorResponse>,
  Fixture
>

export function useUpdateDeckConfigurationMutation(
  options: UseUpdateDeckConfigurationMutationOptions = {}
): UseUpdateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<Fixture, AxiosError<ErrorResponse>, Fixture>(
    [host, 'deck_configuration'],
    (fixture: Fixture) =>
      updateDeckConfiguration(host as HostConfig, fixture).then(response => {
        queryClient
          .invalidateQueries([host, 'deck_configuration'])
          .catch((e: Error) => {
            throw e
          })
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    updateDeckConfiguration: mutation.mutate,
  }
}
