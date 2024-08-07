import { useQuery } from 'react-query'
import { getClientData } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type {
  ClientDataResponse,
  HostConfig,
  DefaultClientData,
} from '@opentrons/api-client'

export function useClientData<T = DefaultClientData>(
  key: string,
  options: UseQueryOptions<ClientDataResponse<T>, AxiosError> = {}
): UseQueryResult<ClientDataResponse<T>, AxiosError> {
  const host = useHost()
  const query = useQuery<ClientDataResponse<T>, AxiosError>(
    [host, 'client_data', key],
    () =>
      getClientData<T>(host as HostConfig, key).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
