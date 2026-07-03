import { useMutation } from 'react-query'

import { getClientData, updateClientData } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ClientDataResponse,
  DefaultClientData,
} from '@opentrons/api-client'

export type ClientDataAlterer<T = DefaultClientData> = (
  currentData: T | null
) => T

export type UseReadModifyWriteClientDataMutationResult<T = DefaultClientData> =
  UseMutationResult<ClientDataResponse<T>, AxiosError, ClientDataAlterer<T>> & {
    readModifyWriteClientData: UseMutateFunction<
      ClientDataResponse<T>,
      AxiosError,
      ClientDataAlterer<T>
    >
  }

export type UseReadModifyWriteClientDataMutationOptions<T = DefaultClientData> =
  UseMutationOptions<ClientDataResponse<T>, AxiosError, ClientDataAlterer<T>>

export function useReadModifyWriteClientData<T = DefaultClientData>(
  key: string,
  options: UseReadModifyWriteClientDataMutationOptions<T> = {}
): UseReadModifyWriteClientDataMutationResult<T> {
  const host = useHost()

  const mutation = useMutation<
    ClientDataResponse<T>,
    AxiosError,
    ClientDataAlterer<T>
  >(
    getQueryKey(host, 'client_data', key),
    modifier =>
      getClientData<T>(host!, key)
        .then(response => modifier(response?.data?.data ?? null))
        // if the get fails, we can treat it as an empty response
        .catch(() => modifier(null))
        .then((newData: T) =>
          updateClientData<T>(host!, key, newData)
            .then(response => response.data)
            .catch(e => {
              throw e
            })
        ),
    options
  )

  return {
    ...mutation,
    readModifyWriteClientData: mutation.mutate,
  }
}
