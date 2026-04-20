import { useMutation } from 'react-query'

import { updateClientData } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AxiosError,
  ClientDataResponse,
  DefaultClientData,
} from '@opentrons/api-client'

export type UseUpdateClientDataMutationResult<T = DefaultClientData> =
  UseMutationResult<ClientDataResponse<T>, AxiosError, T> & {
    updateClientData: UseMutateFunction<ClientDataResponse<T>, AxiosError, T>
  }

export type UseUpdateClientDataMutationOptions<T = DefaultClientData> =
  UseMutationOptions<ClientDataResponse<T>, AxiosError, T>

export function useUpdateClientData<T = DefaultClientData>(
  key: string,
  options: UseUpdateClientDataMutationOptions<T> = {}
): UseUpdateClientDataMutationResult<T> {
  const host = useHost()

  const mutation = useMutation<ClientDataResponse<T>, AxiosError, T>(
    [host, 'client_data', key],
    async (clientData: T) => {
      if (host == null) {
        throw new Error('Host config is required')
      }
      return await updateClientData<T>(host, key, clientData)
        .then(response => response.data)
        .catch(e => {
          throw e
        })
    },
    options
  )

  return {
    ...mutation,
    updateClientData: mutation.mutate,
  }
}
