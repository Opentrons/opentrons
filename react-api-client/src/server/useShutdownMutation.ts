import { useMutation } from 'react-query'

import { shutdown } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, ShutdownResponse } from '@opentrons/api-client'

export type UseShutdownMutationResult = UseMutationResult<
  ShutdownResponse,
  AxiosError,
  void
> & {
  shutdown: UseMutateFunction<ShutdownResponse, AxiosError, void>
}

export type UseShutdownMutationOptions = UseMutationOptions<
  ShutdownResponse,
  AxiosError,
  void
>

export function useShutdownMutation(
  options: UseShutdownMutationOptions = {},
  hostOverride?: HostConfig | null
): UseShutdownMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<ShutdownResponse, AxiosError>(
    getQueryKey(host, 'server', 'shutdown'),
    () =>
      shutdown(host!)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    shutdown: mutation.mutate,
  }
}
