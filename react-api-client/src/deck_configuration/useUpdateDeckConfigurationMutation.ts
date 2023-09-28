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
  Omit<Fixture, 'fixtureId'>,
  AxiosError<ErrorResponse>,
  Omit<Fixture, 'fixtureId'>
> & {
  updateDeckConfiguration: UseMutateFunction<
    Omit<Fixture, 'fixtureId'>,
    AxiosError<ErrorResponse>,
    Omit<Fixture, 'fixtureId'>
  >
}

export type UseUpdateDeckConfigurationMutationOptions = UseMutationOptions<
  Omit<Fixture, 'fixtureId'>,
  AxiosError<ErrorResponse>,
  Omit<Fixture, 'fixtureId'>
>

export function useUpdateDeckConfigurationMutation(
  options: UseUpdateDeckConfigurationMutationOptions = {}
): UseUpdateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    Omit<Fixture, 'fixtureId'>,
    AxiosError<ErrorResponse>,
    Omit<Fixture, 'fixtureId'>
  >(
    [host, 'deck_configuration'],
    (fixture: Omit<Fixture, 'fixtureId'>) =>
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
