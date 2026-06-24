import { useMutation } from 'react-query'

import { postWifiDisconnect } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  WifiDisconnectRequest,
  WifiDisconnectResponse,
} from '@opentrons/api-client'

export type UsePostWifiDisconnectMutationResult = UseMutationResult<
  WifiDisconnectResponse,
  AxiosError,
  WifiDisconnectRequest
> & {
  postWifiDisconnect: UseMutateFunction<
    WifiDisconnectResponse,
    AxiosError,
    WifiDisconnectRequest
  >
}

export type UsePostWifiDisconnectMutationOptions = UseMutationOptions<
  WifiDisconnectResponse,
  AxiosError,
  WifiDisconnectRequest
>

export function usePostWifiDisconnectMutation(
  options: UsePostWifiDisconnectMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePostWifiDisconnectMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<
    WifiDisconnectResponse,
    AxiosError,
    WifiDisconnectRequest
  >(async data => (await postWifiDisconnect(host!, data)).data, options)
  return {
    ...mutation,
    postWifiDisconnect: mutation.mutate,
  }
}
