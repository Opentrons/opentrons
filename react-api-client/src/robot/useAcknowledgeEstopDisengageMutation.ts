import { useMutation, useQueryClient } from 'react-query'
import { acknowledgeEstopDisengage } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError, AxiosResponse } from 'axios'
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
  const queryClient = useQueryClient()
  const mutation = useMutation<EstopStatus, AxiosError, unknown>(
    [host, 'robot/control/acknowledgeEstopDisengage'],
    () => {
      return acknowledgeEstopDisengage(host as HostConfig)
        .then((response: AxiosResponse<EstopStatus>) => {
          queryClient.setQueryData(
            [host, 'robot/control/estopStatus'],
            response.data
          )
          return response.data
        })
        .catch((e: any) => {
          queryClient.invalidateQueries([host, 'robot/control/estopStatus'])
          throw e
        })
    },
    options
  )

  return {
    ...mutation,
    acknowledgeEstopDisengage: mutation.mutate,
  }
}
