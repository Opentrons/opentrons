import { useMutation } from 'react-query'

import { createSplash } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  HttpClientError,
  HttpResponse,
} from '@opentrons/api-client'

export interface CreateSplashRequestData {
  file: File
}
export type UseCreateSplashMutationResult = UseMutationResult<
  HttpResponse<void>,
  HttpClientError<ErrorResponse>,
  CreateSplashRequestData
> & {
  createSplash: UseMutateFunction<
    HttpResponse<void>,
    HttpClientError<ErrorResponse>,
    CreateSplashRequestData
  >
}

export type UseCreateSplashMutationOptions = UseMutationOptions<
  HttpResponse<void>,
  HttpClientError<ErrorResponse>,
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
    HttpResponse<void>,
    HttpClientError<ErrorResponse>,
    CreateSplashRequestData
  >(
    [host, 'splash'],
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
