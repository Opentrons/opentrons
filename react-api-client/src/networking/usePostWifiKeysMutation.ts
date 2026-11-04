import { useQueryClient } from 'react-query'

import { postWifiKeys } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { wifiKeysQueryKey } from './useWifiKeysQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { WifiKey } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  options: UsePostWifiKeysMutationOptions = {}
): UsePostWifiKeysMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<WifiKey, AxiosError, File>(
    documentationState,
    ['connect_wifi'],
    async ({ variables: keyFile, userNotes }) => {
      const response = await postWifiKeys(host!, keyFile, userNotes)
      // Note: This `await` is important. We want to only consider this mutation complete
      // after postWifiKeys() succeeds, AND after any callers of useWifiKeysQuery() have
      // completed a refetch to see the latest list, including the new key. The UI
      // shouldn't have to account for torn state where the key has/hasn't been added.
      await queryClient.invalidateQueries(wifiKeysQueryKey(host))
      return response.data
    },
    options
  )
  return {
    ...mutation,
    postWifiKeys: mutation.mutate,
  }
}
