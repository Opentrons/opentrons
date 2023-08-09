import {
  HostConfig,
  EstopStatus,
  acknowledgeEstopDisengage,
} from '@opentrons/api-client'

import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'

import { useHost } from '../api'
import type { AxiosError } from 'axios'

export type UseSetEstopPhysicalStatusMutationResult = UseMutationResult<
  EstopStatus,
  AxiosError
> & {
  acknowledgeEstopDisengage: UseMutateFunction<EstopStatus, AxiosError>
}

export type UseSetEstopPhysicalStatusMutationOptions = UseMutationOptions<
  EstopStatus,
  AxiosError
>

export function useAcknowledgeEstopDisengageMutation(
  options: UseSetEstopPhysicalStatusMutationOptions = {},
  hostOverride?: HostConfig | null
): UseSetEstopPhysicalStatusMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<EstopStatus, AxiosError>(
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
