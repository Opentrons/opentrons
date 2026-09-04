import { useQuery } from 'react-query'

import { getClientData } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  ClientDataResponse,
  DefaultClientData,
} from '@opentrons/api-client'

export function useClientData<T = DefaultClientData>(
  key: string,
  options: UseQueryOptions<ClientDataResponse<T>, AxiosError> = {}
): UseQueryResult<ClientDataResponse<T>, AxiosError> {
  const host = useHost()
  const query = useQuery<ClientDataResponse<T>, AxiosError>(
    getQueryKey(host, 'client_data', key),
    () => getClientData<T>(host!, key).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
