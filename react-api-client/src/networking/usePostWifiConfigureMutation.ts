import { useQueryClient } from 'react-query'

import { postWifiConfigure } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { networkingStatusQueryKey } from './useNetworkingStatusQuery'
import { wifiQueryKey } from './useWifiQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  WifiConfigureRequest,
  WifiConfigureResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UsePostWifiConfigureMutationResult = UseMutationResult<
  WifiConfigureResponse,
  AxiosError,
  WifiConfigureRequest
> & {
  postWifiConfigure: UseMutateFunction<
    WifiConfigureResponse,
    AxiosError,
    WifiConfigureRequest
  >
}

export type UsePostWifiConfigureMutationOptions = UseMutationOptions<
  WifiConfigureResponse,
  AxiosError,
  WifiConfigureRequest
>

export function usePostWifiConfigureMutation(
  documentationState: DocumentationState,
  options: UsePostWifiConfigureMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePostWifiConfigureMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    WifiConfigureResponse,
    AxiosError,
    WifiConfigureRequest
  >(
    documentationState,
    ['wifi_config'],
    networkingStatusQueryKey(host),
    ({
      variables: wifiOptions,
      userNotes,
    }: DocumentedMutationParameters<WifiConfigureRequest>) =>
      postWifiConfigure(host!, wifiOptions, userNotes).then(response => {
        queryClient
          .invalidateQueries(networkingStatusQueryKey(host))
          .catch((e: Error) => {
            console.error(
              `error invalidating networking status query: ${e.message}`
            )
          })
        queryClient.invalidateQueries(wifiQueryKey(host)).catch((e: Error) => {
          console.error(`error invalidating wifi query: ${e.message}`)
        })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    postWifiConfigure: mutation.mutate,
  }
}
