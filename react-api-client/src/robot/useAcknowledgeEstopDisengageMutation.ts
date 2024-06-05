import { useMutation } from 'react-query'
import { acknowledgeEstopDisengage } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import type { HostConfig, EstopStatus } from '@opentrons/api-client'

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
    [
      getSanitizedQueryKeyObject(host),
      'robot/control/acknowledgeEstopDisengage',
    ],
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
