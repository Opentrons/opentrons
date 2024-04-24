import { useMutation } from 'react-query'
import { createSplash } from '@opentrons/api-client'
import { useHost } from '../api'

import type { AxiosError, AxiosResponse } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
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

  const mutation = useMutation<
    AxiosResponse<void>,
    AxiosError<ErrorResponse>,
    CreateSplashRequestData
  >(
    [host, 'splash'],
    ({ file }) =>
      createSplash(host as HostConfig, file).catch(e => {
        throw e
      }),
    options
  )
  return {
    ...mutation,
    createSplash: mutation.mutate,
  }
}
