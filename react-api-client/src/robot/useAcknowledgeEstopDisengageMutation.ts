import { useQueryClient } from 'react-query'

import { acknowledgeEstopDisengage } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError, AxiosResponse } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EstopStatus, HostConfig } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedMutationParameters,
} from '../accessControl/types'

export type UseAcknowledgeEstopDisengageMutationResult = UseMutationResult<
  EstopStatus,
  AxiosError,
  void
> & {
  acknowledgeEstopDisengage: UseMutateFunction<EstopStatus, AxiosError, void>
}

export type UseAcknowledgeEstopDisengageMutationOptions = UseMutationOptions<
  EstopStatus,
  AxiosError,
  void
>

export function useAcknowledgeEstopDisengageMutation(
  documentationState: DocumentationState,
  options: UseAcknowledgeEstopDisengageMutationOptions = {},
  hostOverride?: HostConfig | null
): UseAcknowledgeEstopDisengageMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<EstopStatus, AxiosError>(
    documentationState,
    ['acknowledge_estop'],
    getQueryKey(host, 'robot/control/acknowledgeEstopDisengage'),
    ({ userNotes }: DocumentedMutationParameters<void>) => {
      return acknowledgeEstopDisengage(host!, userNotes)
        .then((response: AxiosResponse<EstopStatus>) => {
          queryClient.setQueryData(
            getQueryKey(host, 'robot/control/estopStatus'),
            response.data
          )
          return response.data
        })
        .catch((e: any) => {
          queryClient.invalidateQueries(
            getQueryKey(host, 'robot/control/estopStatus')
          )
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
