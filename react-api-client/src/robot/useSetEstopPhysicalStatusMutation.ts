import {
  HostConfig,
  EstopStatus,
  setEstopPhysicalStatus,
  SetEstopState,
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
  AxiosError,
  SetEstopState
> & {
  setEstopPhysicalStatus: UseMutateFunction<
    EstopStatus,
    AxiosError,
    SetEstopState
  >
}

export type UseSetEstopPhysicalStatusMutationOptions = UseMutationOptions<
  EstopStatus,
  AxiosError,
  SetEstopState
>

export function useSetEstopPhysicalStatusMutation(
  options: UseSetEstopPhysicalStatusMutationOptions = {},
  hostOverride?: HostConfig | null
): UseSetEstopPhysicalStatusMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<EstopStatus, AxiosError, SetEstopState>(
    [host, 'robot/control/acknowledgeEstopDisengage'],
    (newStatus: SetEstopState) =>
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
