import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'

import {
  HostConfig,
  EstopStatus,
  acknowledgeEstopDisengage,
} from '@opentrons/api-client'

import { useHost } from '../api'
import type { AxiosError } from 'axios'

export type UseAcknowledgeEstopDisengageMutationResult = UseMutationResult<
  EstopStatus,
  AxiosError
> & {
  acknowledgeEstopDisengage: UseMutateFunction<EstopStatus, AxiosError, unknown>
}

export type UseAcknowledgeEstopDisengageMutationOptions = UseMutationOptions<
  EstopStatus,
  AxiosError,
  unknown
>

export function useAcknowledgeEstopDisengageMutation(
  options: UseAcknowledgeEstopDisengageMutationOptions = {},
  hostOverride?: HostConfig | null
): UseAcknowledgeEstopDisengageMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<EstopStatus, AxiosError, unknown>(
    [host, 'robot/control/acknowledgeEstopDisengage'],
    () =>
      acknowledgeEstopDisengage(host as HostConfig)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    acknowledgeEstopDisengage: mutation.mutate,
  }
}
