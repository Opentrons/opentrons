import { postWifiDisconnect } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  WifiDisconnectRequest,
  WifiDisconnectResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  options: UsePostWifiDisconnectMutationOptions = {}
): UsePostWifiDisconnectMutationResult {
  const host = useHost()
  const mutation = useDocumentedMutation<
    WifiDisconnectResponse,
    AxiosError,
    WifiDisconnectRequest
  >(
    documentationState,
    ['disconnect_wifi'],
    ({ variables: data, userNotes }) =>
      postWifiDisconnect(host!, data, userNotes).then(
        response => response.data
      ),
    options
  )
  return {
    ...mutation,
    postWifiDisconnect: mutation.mutate,
  }
}
