import { useMutation, useQueryClient } from 'react-query'

import { postWifiKeys } from '@opentrons/api-client'

import { useHost } from '../api'
import { wifiKeysQueryKey } from './useWifiKeysQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, WifiKey } from '@opentrons/api-client'

export type UsePostWifiKeysMutationResult = UseMutationResult<
  WifiKey,
  AxiosError,
  File
> & {
  postWifiKeys: UseMutateFunction<WifiKey, AxiosError, File>
}

export type UsePostWifiKeysMutationOptions = UseMutationOptions<
  WifiKey,
  AxiosError,
  File
>

export function usePostWifiKeysMutation(
  options: UsePostWifiKeysMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePostWifiKeysMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const mutation = useMutation<WifiKey, AxiosError, File>(async keyFile => {
    const response = await postWifiKeys(host!, keyFile)
    // Note: This `await` is important. We want to only consider this mutation complete
    // after postWifiKeys() succeeds, AND after any callers of useWifiKeysQuery() have
    // completed a refetch to see the latest list, including the new key. The UI
    // shouldn't have to account for torn state where the key has/hasn't been added.
    await queryClient.invalidateQueries(wifiKeysQueryKey(host))
    return response.data
  }, options)
  return {
    ...mutation,
    postWifiKeys: mutation.mutate,
  }
}
