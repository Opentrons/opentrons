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
import type { CutoutConfig } from '@opentrons/shared-data'

export type UseUpdateDeckConfigurationMutationResult = UseMutationResult<
  CutoutConfig,
  AxiosError<ErrorResponse>,
  CutoutConfig
> & {
  updateDeckConfiguration: UseMutateFunction<
    CutoutConfig,
    AxiosError<ErrorResponse>,
    CutoutConfig
  >
}

export type UseUpdateDeckConfigurationMutationOptions = UseMutationOptions<
  CutoutConfig,
  AxiosError<ErrorResponse>,
  CutoutConfig
>

export function useUpdateDeckConfigurationMutation(
  options: UseUpdateDeckConfigurationMutationOptions = {}
): UseUpdateDeckConfigurationMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CutoutConfig,
    AxiosError<ErrorResponse>,
    CutoutConfig
  >(
    [host, 'deck_configuration'],
    (fixture: CutoutConfig) =>
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
