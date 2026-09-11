import { useMutation } from 'react-query'

import { createSplash } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError, AxiosResponse } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { ErrorResponse, HostConfig } from '@opentrons/api-client'

export interface CreateSplashRequestData {
  file: File
}
export type UseCreateSplashMutationResult = UseMutationResult<
  AxiosResponse<void>,
  AxiosError<ErrorResponse>,
  CreateSplashRequestData
> & {
  createSplash: UseMutateFunction<
    AxiosResponse<void>,
    AxiosError<ErrorResponse>,
    CreateSplashRequestData
  >
}

export type UseCreateSplashMutationOptions = UseMutationOptions<
  AxiosResponse<void>,
  AxiosError<ErrorResponse>,
  CreateSplashRequestData
>

export function useCreateSplashMutation(
  options: UseCreateSplashMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateSplashMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  // For factory use only, does not require documentation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<
    AxiosResponse<void>,
    AxiosError<ErrorResponse>,
    CreateSplashRequestData
  >(
    getQueryKey(host, 'splash'),
    ({ file }) =>
      createSplash(host!, file).catch(e => {
        throw e
      }),
    options
  )
  return {
    ...mutation,
    createSplash: mutation.mutate,
  }
}
