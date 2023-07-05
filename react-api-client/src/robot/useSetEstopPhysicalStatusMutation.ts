import {
  HostConfig,
  EstopState,
  setEstopPhysicalStatus,
  EstopPhysicalStatus,
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
  EstopState,
  AxiosError,
  EstopPhysicalStatus
> & {
  setEstopPhysicalStatus: UseMutateFunction<
    EstopState,
    AxiosError,
    EstopPhysicalStatus
  >
}

export type UseSetEstopPhysicalStatusMutationOptions = UseMutationOptions<
  EstopState,
  AxiosError,
  EstopPhysicalStatus
>

export function useSetEstopPhysicalStatusMutation(
  options: UseSetEstopPhysicalStatusMutationOptions = {},
  hostOverride?: HostConfig | null
): UseSetEstopPhysicalStatusMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<EstopState, AxiosError, EstopPhysicalStatus>(
    [host, 'robot', 'control/acknowledgeEstopDisengage'],
    (newStatus: EstopPhysicalStatus) =>
      setEstopPhysicalStatus(host as HostConfig, newStatus)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    setEstopPhysicalStatus: mutation.mutate,
  }
}
