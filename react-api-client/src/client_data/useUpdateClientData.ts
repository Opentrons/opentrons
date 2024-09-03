import { useMutation } from 'react-query'
import { updateClientData } from '@opentrons/api-client'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type {
  ClientDataResponse,
  DefaultClientData,
  HostConfig,
} from '@opentrons/api-client'

export type UseUpdateClientDataMutationResult<
  T = DefaultClientData
> = UseMutationResult<ClientDataResponse<T>, AxiosError, T> & {
  updateClientData: UseMutateFunction<ClientDataResponse<T>, AxiosError, T>
}

export type UseUpdateClientDataMutationOptions<
  T = DefaultClientData
> = UseMutationOptions<ClientDataResponse<T>, AxiosError, T>

export function useUpdateClientData<T = DefaultClientData>(
  key: string,
  options: UseUpdateClientDataMutationOptions<T> = {}
): UseUpdateClientDataMutationResult<T> {
  const host = useHost()

  const mutation = useMutation<ClientDataResponse<T>, AxiosError, T>(
    [host, 'client_data', key],
    (clientData: T) =>
      updateClientData<T>(host as HostConfig, key, clientData)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    updateClientData: mutation.mutate,
  }
}
